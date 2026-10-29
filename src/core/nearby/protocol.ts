import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { Admin, Config, Mesh, Portnums, Telemetry } from '@meshtastic/protobufs'

import { epochTime, isSensorMetric } from '@core/nearby/metrics'
import { addActivity, addSample, meshId } from '@core/nearby/model'
import type { NearbyNode, History, Peer, Reading, Sample } from '@core/nearby/model'

export function configurationRequest(nonce: number): Uint8Array<ArrayBuffer> {
    return new Uint8Array(
        toBinary(
            Mesh.ToRadioSchema,
            create(Mesh.ToRadioSchema, { payloadVariant: { case: 'wantConfigId', value: nonce } })
        )
    )
}

/** A keepalive; with nonce 0 the firmware only answers with its queue status. */
export function heartbeatRequest(): Uint8Array<ArrayBuffer> {
    return new Uint8Array(
        toBinary(
            Mesh.ToRadioSchema,
            create(Mesh.ToRadioSchema, { payloadVariant: { case: 'heartbeat', value: {} } })
        )
    )
}

/** Ends the client session; over serial this lets the firmware turn Bluetooth back on. */
export function disconnectRequest(): Uint8Array<ArrayBuffer> {
    return new Uint8Array(
        toBinary(
            Mesh.ToRadioSchema,
            create(Mesh.ToRadioSchema, { payloadVariant: { case: 'disconnect', value: true } })
        )
    )
}

/**
 * Asks the local node to reboot into its UF2 bootloader, as the Meshtastic Web
 * Flasher does. The firmware implements it on nRF52 only.
 */
export function dfuRequest(myNodeNum: number): Uint8Array<ArrayBuffer> {
    const admin = create(Admin.AdminMessageSchema, {
        payloadVariant: { case: 'enterDfuModeRequest', value: true },
    })
    const data = create(Mesh.DataSchema, {
        portnum: Portnums.PortNum.ADMIN_APP,
        payload: toBinary(Admin.AdminMessageSchema, admin),
    })
    const packet = create(Mesh.MeshPacketSchema, {
        to: myNodeNum,
        payloadVariant: { case: 'decoded', value: data },
    })
    const message = create(Mesh.ToRadioSchema, {
        payloadVariant: { case: 'packet', value: packet },
    })
    return new Uint8Array(toBinary(Mesh.ToRadioSchema, message))
}

/** The local node number from a `myInfo` frame; null for any other frame. */
export function localNodeNum(bytes: Uint8Array): number | null {
    try {
        const payload = fromBinary(Mesh.FromRadioSchema, bytes).payloadVariant
        return payload.case === 'myInfo' && validNode(payload.value.myNodeNum)
            ? payload.value.myNodeNum
            : null
    } catch {
        return null
    }
}

function validNode(num: number): boolean {
    return Number.isSafeInteger(num) && num > 0 && num < 0xff_ff_ff_ff
}

function enumLabel(values: Readonly<Record<number, string>>, value: number): string {
    return values[value] ?? `Unknown (${String(value)})`
}

function numericReadings(
    values: object,
    variant: string,
    sender: number,
    receivedAt: number,
    measuredAt: number | null,
    cached: boolean
): Readonly<Record<string, Reading>> {
    return Object.fromEntries(
        Object.entries(values)
            .filter(
                (entry): entry is [string, number] =>
                    typeof entry[1] === 'number' && Number.isFinite(entry[1])
            )
            .map(([field, value]) => {
                const metric = `${variant}.${field}`
                return [metric, { metric, value, sender, receivedAt, measuredAt, cached }]
            })
    )
}

function peerInfo(info: Mesh.NodeInfo, previous: Peer | undefined, at: number): Peer {
    const hopsAway = info.viaMqtt ? null : (info.hopsAway ?? null)
    return {
        num: info.num,
        name: info.user?.longName ?? previous?.name ?? '',
        shortName: info.user?.shortName ?? previous?.shortName ?? '',
        hardware: info.user
            ? enumLabel(Mesh.HardwareModel, info.user.hwModel)
            : (previous?.hardware ?? ''),
        lastPacketAt: previous?.lastPacketAt ?? null,
        lastHeardAt: epochTime(info.lastHeard, at),
        // NodeInfo carries SNR only; RSSI comes from packets heard during the session.
        snr: hopsAway === 0 ? info.snr : hopsAway === null ? (previous?.snr ?? null) : null,
        rssi: hopsAway === null || hopsAway === 0 ? (previous?.rssi ?? null) : null,
        hopsAway: hopsAway ?? previous?.hopsAway ?? null,
        readings: info.deviceMetrics
            ? {
                  ...numericReadings(info.deviceMetrics, 'deviceMetrics', info.num, at, null, true),
                  ...previous?.readings,
              }
            : (previous?.readings ?? {}),
    }
}

function applyNodeInfo(node: NearbyNode, info: Mesh.NodeInfo, at: number): NearbyNode {
    if (!validNode(info.num)) throw new Error('Invalid node number')
    const peer = peerInfo(info, node.peers[info.num], at)
    const updated = { ...node, peers: { ...node.peers, [info.num]: peer } }
    return info.num === node.nodeNum
        ? {
              ...updated,
              name: info.user?.longName ?? node.name,
              shortName: info.user?.shortName ?? node.shortName,
              hardware: info.user
                  ? enumLabel(Mesh.HardwareModel, info.user.hwModel)
                  : node.hardware,
              readings: { ...peer.readings, ...node.readings },
          }
        : updated
}

function applyConfiguration(node: NearbyNode, config: Config.Config): NearbyNode {
    const payload = config.payloadVariant
    let fields: Record<string, string> = {}
    if (payload.case === 'device') {
        fields = {
            'Meshtastic role': enumLabel(Config.Config_DeviceConfig_Role, payload.value.role),
        }
    } else if (payload.case === 'lora') {
        fields = {
            'LoRa region': enumLabel(Config.Config_LoRaConfig_RegionCode, payload.value.region),
            'Modem preset': payload.value.usePreset
                ? enumLabel(Config.Config_LoRaConfig_ModemPreset, payload.value.modemPreset)
                : 'Custom',
            'Radio transmission': payload.value.txEnabled ? 'Enabled' : 'Disabled',
        }
    }
    return { ...node, configuration: { ...node.configuration, ...fields } }
}

/** Battery voltage and sensor metrics keep a history for their trends. */
function recordHistory(history: History, readings: Readonly<Record<string, Reading>>): History {
    const next: Record<string, readonly Sample[]> = { ...history }
    for (const reading of Object.values(readings)) {
        const tracked =
            (reading.metric === 'deviceMetrics.voltage' && reading.value > 0) ||
            isSensorMetric(reading.metric)
        if (!tracked || !Number.isFinite(reading.value)) continue
        next[reading.metric] = addSample(history[reading.metric] ?? [], {
            value: reading.value,
            at: reading.measuredAt ?? reading.receivedAt,
        })
    }
    return next
}

function applyPacket(node: NearbyNode, packet: Mesh.MeshPacket, at: number): NearbyNode {
    if (!validNode(packet.from)) throw new Error('Invalid sender')
    const sender = packet.from
    const local = sender === node.nodeNum
    const payload = packet.payloadVariant
    let readings: Readonly<Record<string, Reading>> = {}
    let summary = 'Packet received'
    if (payload.case === 'decoded' && payload.value.portnum === Portnums.PortNum.TELEMETRY_APP) {
        const telemetry = fromBinary(Telemetry.TelemetrySchema, payload.value.payload)
        if (telemetry.variant.case === undefined) throw new Error('Missing telemetry variant')
        readings = numericReadings(
            telemetry.variant.value,
            telemetry.variant.case,
            sender,
            at,
            epochTime(telemetry.time, at),
            false
        )
        const summaries: Readonly<Record<string, string>> = {
            deviceMetrics: 'Device telemetry received',
            environmentMetrics: 'Environmental telemetry received',
            airQualityMetrics: 'Particle telemetry received',
            powerMetrics: 'Power telemetry received',
        }
        summary = summaries[telemetry.variant.case] ?? 'Telemetry received'
    } else if (
        payload.case === 'decoded' &&
        payload.value.portnum === Portnums.PortNum.NODEINFO_APP
    ) {
        const user = fromBinary(Mesh.UserSchema, payload.value.payload)
        node = applyNodeInfo(node, create(Mesh.NodeInfoSchema, { num: sender, user }), at)
    }
    const previous = node.peers[sender]
    const hops =
        local || packet.viaMqtt || packet.hopStart === 0 || packet.hopLimit > packet.hopStart
            ? null
            : packet.hopStart - packet.hopLimit
    const updated: NearbyNode = {
        ...node,
        lastPacketAt: local ? at : node.lastPacketAt,
        readings: local ? { ...node.readings, ...readings } : node.readings,
        history: local ? recordHistory(node.history, readings) : node.history,
        peers: {
            ...node.peers,
            [sender]: {
                num: sender,
                name: previous?.name ?? '',
                shortName: previous?.shortName ?? '',
                hardware: previous?.hardware ?? '',
                lastPacketAt: at,
                lastHeardAt: epochTime(packet.rxTime ?? 0, at) ?? previous?.lastHeardAt ?? null,
                snr: hops === 0 ? packet.rxSnr : hops === null ? (previous?.snr ?? null) : null,
                rssi:
                    hops === 0
                        ? packet.rxRssi === undefined || packet.rxRssi === 0
                            ? null
                            : packet.rxRssi
                        : hops === null
                          ? (previous?.rssi ?? null)
                          : null,
                hopsAway: hops ?? previous?.hopsAway ?? null,
                readings: { ...previous?.readings, ...readings },
            },
        },
    }
    return addActivity(updated, `${summary} · sender ${meshId(sender)}`, at)
}

export function receiveRadio(
    node: NearbyNode,
    bytes: Uint8Array,
    at: number,
    nonce: number
): NearbyNode {
    try {
        const payload = fromBinary(Mesh.FromRadioSchema, bytes).payloadVariant
        switch (payload.case) {
            case 'myInfo': {
                if (!validNode(payload.value.myNodeNum))
                    throw new Error('Invalid local node number')
                const num = payload.value.myNodeNum
                const peer = node.peers[num]
                return addActivity(
                    {
                        ...node,
                        nodeNum: num,
                        name: peer?.name ?? node.name,
                        shortName: peer?.shortName ?? node.shortName,
                        hardware: peer && peer.hardware !== '' ? peer.hardware : node.hardware,
                        lastPacketAt:
                            peer?.lastPacketAt ?? (node.nodeNum === num ? node.lastPacketAt : null),
                        // Equal USB boards share a port ID, so another node can take over
                        // this entry; its history must not carry over to the new number.
                        history: node.nodeNum === num ? node.history : {},
                        readings: {
                            ...peer?.readings,
                            ...Object.fromEntries(
                                Object.entries(node.readings).filter(
                                    ([, reading]) => reading.sender === num
                                )
                            ),
                        },
                    },
                    'Node identity received',
                    at
                )
            }
            case 'nodeInfo': {
                return applyNodeInfo(node, payload.value, at)
            }
            case 'metadata': {
                return {
                    ...node,
                    firmware: payload.value.firmwareVersion,
                    hardware: enumLabel(Mesh.HardwareModel, payload.value.hwModel),
                }
            }
            case 'config': {
                return applyConfiguration(node, payload.value)
            }
            case 'moduleConfig': {
                const variant = payload.value.payloadVariant
                if (variant.case !== 'telemetry') return node
                const telemetry = variant.value
                const interval = (value: number) =>
                    value === 0 ? 'Firmware default' : `${String(value)} s`
                return {
                    ...node,
                    configuration: {
                        ...node.configuration,
                        'Device telemetry interval': interval(telemetry.deviceUpdateInterval),
                        'Environmental telemetry': telemetry.environmentMeasurementEnabled
                            ? 'Enabled'
                            : 'Disabled',
                        'Environmental interval': interval(telemetry.environmentUpdateInterval),
                        'Particle telemetry': telemetry.airQualityEnabled ? 'Enabled' : 'Disabled',
                        'Particle interval': interval(telemetry.airQualityInterval),
                    },
                }
            }
            case 'configCompleteId': {
                return payload.value === nonce && node.nodeNum !== null
                    ? addActivity({ ...node, state: 'connected' }, 'Connected', at)
                    : node
            }
            case 'packet': {
                return applyPacket(node, payload.value, at)
            }
            case 'rebooted': {
                return addActivity({ ...node, state: 'disconnected' }, 'Node restarted', at)
            }
            case undefined:
            case 'xmodemPacket':
            case 'mqttClientProxyMessage':
            case 'channel':
            case 'logRecord':
            case 'queueStatus':
            case 'fileInfo':
            case 'clientNotification':
            case 'deviceuiConfig':
            case 'lockdownStatus':
            case 'regionPresets': {
                // Secret-bearing configuration, channel keys and node logs are intentionally ignored.
                return node
            }
        }
    } catch {
        return addActivity(node, 'Malformed packet ignored', at)
    }
}

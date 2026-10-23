import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { Admin, Config, Mesh, Portnums, Telemetry } from '@meshtastic/protobufs'
import { describe, expect, it } from 'vitest'

import { isMfdNode, mfdKind } from '@core/nearby/firmware'
import {
    batteryFromVoltage,
    bestLink,
    epochTime,
    localTime,
    metricLabel,
    metricStats,
    nearestPeers,
    readingValue,
    signalQuality,
    signedChange,
    trend,
    voltageTrend,
} from '@core/nearby/metrics'
import { deviceName, emptyDevice } from '@core/nearby/model'
import {
    configurationRequest,
    disconnectRequest,
    dfuRequest,
    localNodeNum,
    receiveRadio,
} from '@core/nearby/protocol'

import { linkPacket, radioMessage, telemetryPacket } from '../../support/nearby'

const NOW = Date.UTC(2026, 9, 3, 12)
const LOCAL = 1234
const PEER = 5678
const NONCE = 42

function localDevice() {
    return receiveRadio(
        emptyDevice('local', 'Meshtastic'),
        radioMessage({
            case: 'myInfo',
            value: create(Mesh.MyNodeInfoSchema, { myNodeNum: LOCAL }),
        }),
        NOW,
        NONCE
    )
}

describe('nearby device protocol', () => {
    it.each([
        ['MFD Sensor 8b79', 'MFD Sensor'],
        ['Meshtastic_8B79', 'Meshtastic'],
        ['8b79', ''],
        ['Ridge relay', 'Ridge relay'],
    ])('drops the ID suffix the node tag already shows (%s)', (name, expected) => {
        expect(deviceName({ name, bluetoothName: '', nodeNum: 0xda_5a_8b_79 })).toBe(expected)
    })

    it('encodes a disconnect so the firmware can resume Bluetooth advertising', () => {
        expect(fromBinary(Mesh.ToRadioSchema, disconnectRequest()).payloadVariant).toEqual({
            case: 'disconnect',
            value: true,
        })
    })

    it.each([
        [3.5, 3.55, 'rising'],
        [3.55, 3.5, 'falling'],
        [3.501, 3.504, 'steady'],
    ])('compares two fresh local voltages (%s → %s)', (first, second, expected) => {
        const sample = (voltage: number) =>
            telemetryPacket(LOCAL, {
                case: 'deviceMetrics',
                value: create(Telemetry.DeviceMetricsSchema, { voltage }),
            })
        let device = receiveRadio(localDevice(), sample(first), NOW, NONCE)
        expect(voltageTrend(device)).toBeNull()
        device = receiveRadio(device, sample(second), NOW + 60_000, NONCE)
        expect(voltageTrend(device)?.direction).toBe(expected)
        // Samples under five minutes apart replace the newest one.
        device = receiveRadio(device, sample(3.6), NOW + 120_000, NONCE)
        expect(device.history['deviceMetrics.voltage'] ?? []).toHaveLength(2)
        device = receiveRadio(device, sample(3.6), NOW + 6 * 60_000, NONCE)
        expect(device.history['deviceMetrics.voltage'] ?? []).toHaveLength(3)
    })

    it('excludes cached values, peer voltages, duplicates and older measurements from the voltage trend', () => {
        let device = receiveRadio(
            localDevice(),
            radioMessage({
                case: 'nodeInfo',
                value: create(Mesh.NodeInfoSchema, {
                    num: LOCAL,
                    deviceMetrics: { voltage: 3.7 },
                }),
            }),
            NOW,
            NONCE
        )
        const sample = (sender: number, voltage: number, time: number) =>
            telemetryPacket(
                sender,
                {
                    case: 'deviceMetrics',
                    value: create(Telemetry.DeviceMetricsSchema, { voltage }),
                },
                time
            )
        device = receiveRadio(device, sample(PEER, 4.1, NOW / 1000), NOW, NONCE)
        expect(device.history['deviceMetrics.voltage'] ?? []).toHaveLength(0)
        device = receiveRadio(device, sample(LOCAL, 3.5, NOW / 1000), NOW + 1000, NONCE)
        device = receiveRadio(device, sample(LOCAL, 3.5, NOW / 1000), NOW + 2000, NONCE)
        device = receiveRadio(device, sample(LOCAL, 3.9, NOW / 1000 - 60), NOW + 3000, NONCE)
        expect(device.history['deviceMetrics.voltage'] ?? []).toHaveLength(1)
        expect(voltageTrend(device)).toBeNull()
        device = receiveRadio(device, sample(LOCAL, 3.55, NOW / 1000 + 60), NOW + 60_000, NONCE)
        expect(voltageTrend(device)?.direction).toBe('rising')
    })
    it('keeps a history of local sensor readings, but not of peers, for trends', () => {
        const sample = (sender: number, temperature: number, time: number) =>
            telemetryPacket(
                sender,
                {
                    case: 'environmentMetrics',
                    value: create(Telemetry.EnvironmentMetricsSchema, { temperature }),
                },
                time
            )
        let device = receiveRadio(localDevice(), sample(LOCAL, 20, NOW / 1000), NOW, NONCE)
        device = receiveRadio(device, sample(PEER, 35, NOW / 1000), NOW, NONCE)
        device = receiveRadio(device, sample(LOCAL, 20.4, NOW / 1000 + 600), NOW + 600_000, NONCE)
        const change = trend(device.history['environmentMetrics.temperature'])
        expect(change?.direction).toBe('rising')
        expect(signedChange('environmentMetrics.temperature', change?.change ?? 0)).toBe('+0.4 °C')
        expect(device.history['environmentMetrics.temperature']).toHaveLength(2)
    })

    it('only sends a local configuration read request', () => {
        const request = fromBinary(Mesh.ToRadioSchema, configurationRequest(NONCE))
        expect(request.payloadVariant).toEqual({ case: 'wantConfigId', value: NONCE })
    })

    it('initializes only after identity and a matching completion nonce', () => {
        const complete = radioMessage({ case: 'configCompleteId', value: NONCE })
        expect(receiveRadio(emptyDevice('local', ''), complete, NOW, NONCE).state).toBe(
            'disconnected'
        )
        expect(receiveRadio(localDevice(), complete, NOW, NONCE + 1).state).toBe('disconnected')
        expect(receiveRadio(localDevice(), complete, NOW, NONCE).state).toBe('connected')
    })

    it('keeps sensor timestamps independent from device telemetry', () => {
        const sensor = receiveRadio(
            localDevice(),
            telemetryPacket(
                LOCAL,
                {
                    case: 'environmentMetrics',
                    value: create(Telemetry.EnvironmentMetricsSchema, { temperature: -5.25 }),
                },
                NOW / 1000 - 60
            ),
            NOW,
            NONCE
        )
        const next = receiveRadio(
            sensor,
            telemetryPacket(LOCAL, {
                case: 'deviceMetrics',
                value: create(Telemetry.DeviceMetricsSchema, { batteryLevel: 80 }),
            }),
            NOW + 20_000,
            NONCE
        )
        expect(next.readings['environmentMetrics.temperature']).toEqual({
            metric: 'environmentMetrics.temperature',
            value: -5.25,
            sender: LOCAL,
            receivedAt: NOW,
            measuredAt: NOW - 60_000,
            cached: false,
        })
        expect(next.readings['deviceMetrics.batteryLevel']?.receivedAt).toBe(NOW + 20_000)
        expect(next.readings['environmentMetrics.relativeHumidity']).toBeUndefined()
        expect(next.readings['airQualityMetrics.pm25Standard']).toBeUndefined()
    })

    it('attributes peer telemetry to its sender instead of the Bluetooth node', () => {
        const next = receiveRadio(
            localDevice(),
            telemetryPacket(PEER, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 31 }),
            }),
            NOW,
            NONCE
        )
        expect(next.readings).toEqual({})
        expect(next.lastPacketAt).toBeNull()
        expect(next.peers[PEER]?.readings['environmentMetrics.temperature']?.value).toBe(31)
        expect(next.activity.at(-1)?.message).toContain('!0000162e')
    })

    it('retains packets received before the local identity is known', () => {
        let device = receiveRadio(
            emptyDevice('local', ''),
            telemetryPacket(LOCAL, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 23 }),
            }),
            NOW,
            NONCE
        )
        expect(device.readings).toEqual({})
        device = receiveRadio(
            device,
            radioMessage({
                case: 'myInfo',
                value: create(Mesh.MyNodeInfoSchema, { myNodeNum: LOCAL }),
            }),
            NOW,
            NONCE
        )
        expect(device.readings['environmentMetrics.temperature']?.sender).toBe(LOCAL)
    })

    it('drops the history of another node that reported on the same entry', () => {
        let device = receiveRadio(
            localDevice(),
            telemetryPacket(LOCAL, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 23 }),
            }),
            NOW,
            NONCE
        )
        expect(device.history['environmentMetrics.temperature']).toHaveLength(1)
        const myInfo = (myNodeNum: number) =>
            radioMessage({ case: 'myInfo', value: create(Mesh.MyNodeInfoSchema, { myNodeNum }) })
        expect(receiveRadio(device, myInfo(LOCAL), NOW, NONCE).history).toBe(device.history)
        device = receiveRadio(device, myInfo(PEER), NOW, NONCE)
        expect(device.nodeNum).toBe(PEER)
        expect(device.history).toEqual({})
    })

    it('marks cached node database metrics as cached with no invented measurement time', () => {
        const next = receiveRadio(
            localDevice(),
            radioMessage({
                case: 'nodeInfo',
                value: create(Mesh.NodeInfoSchema, {
                    num: LOCAL,
                    deviceMetrics: { batteryLevel: 0 },
                    user: { longName: 'Test node', hwModel: Mesh.HardwareModel.RAK4631 },
                }),
            }),
            NOW,
            NONCE
        )
        expect(next.name).toBe('Test node')
        expect(next.hardware).toBe('RAK4631')
        expect(next.readings['deviceMetrics.batteryLevel']).toMatchObject({
            value: 0,
            cached: true,
            measuredAt: null,
        })
        expect(next.lastPacketAt).toBeNull()
    })

    it('ignores malformed packets, invalid senders and non-finite measurements', () => {
        const device = localDevice()
        const malformed = receiveRadio(device, new Uint8Array([0xff]), NOW, NONCE)
        expect(malformed.readings).toEqual({})
        expect(malformed.activity.at(-1)?.message).toBe('Malformed packet ignored')
        const invalid = receiveRadio(
            device,
            telemetryPacket(0, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 20 }),
            }),
            NOW,
            NONCE
        )
        expect(invalid.readings).toEqual({})
        const nonFinite = receiveRadio(
            device,
            telemetryPacket(LOCAL, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, {
                    temperature: NaN,
                    relativeHumidity: 50,
                }),
            }),
            NOW,
            NONCE
        )
        expect(nonFinite.readings['environmentMetrics.temperature']).toBeUndefined()
        expect(nonFinite.readings['environmentMetrics.relativeHumidity']?.value).toBe(50)
    })

    it('does not retain channel keys, credentials, private keys or firmware logs', () => {
        let device = localDevice()
        device = receiveRadio(
            device,
            radioMessage({
                case: 'logRecord',
                value: create(Mesh.LogRecordSchema, { message: 'secret-log' }),
            }),
            NOW,
            NONCE
        )
        const securityConfig = create(Config.ConfigSchema, {
            payloadVariant: { case: 'security', value: { privateKey: new Uint8Array([1, 2, 3]) } },
        })
        device = receiveRadio(
            device,
            radioMessage({
                case: 'config',
                value: securityConfig,
            }),
            NOW,
            NONCE
        )
        expect(JSON.stringify(device)).not.toContain('secret-log')
        expect(JSON.stringify(device)).not.toContain('privateKey')
        expect(device.configuration).toEqual({})
    })

    it('preserves unknown metrics without assigning guessed units', () => {
        const next = receiveRadio(
            localDevice(),
            telemetryPacket(LOCAL, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { lux: 12, gasResistance: 31 }),
            }),
            NOW,
            NONCE
        )
        expect(metricLabel('environmentMetrics.lux')).toBe('environmentMetrics.lux')
        expect(readingValue(next.readings['environmentMetrics.lux']!)).toBe('12')
        // The BME680 driver reports gas resistance in kΩ, despite the protobuf comment.
        expect(readingValue(next.readings['environmentMetrics.gasResistance']!)).toBe('31 kΩ')
        expect(epochTime(NOW / 1000 + 1, NOW)).toBeNull()
        expect(epochTime(0, NOW)).toBeNull()
        expect(epochTime(9489, NOW)).toBeNull()
        const deviceWithoutClock = receiveRadio(
            localDevice(),
            telemetryPacket(
                LOCAL,
                {
                    case: 'environmentMetrics',
                    value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 24 }),
                },
                9489
            ),
            NOW,
            NONCE
        )
        expect(deviceWithoutClock.readings['environmentMetrics.temperature']).toMatchObject({
            value: 24,
            measuredAt: null,
            receivedAt: NOW,
        })
    })

    it('records link quality only for packets heard directly over LoRa', () => {
        const RELAYED = 9012
        const MQTT = 3456
        let device = localDevice()
        device = receiveRadio(
            device,
            linkPacket(PEER, { snr: 6.5, rssi: -92, hops: 0 }),
            NOW,
            NONCE
        )
        device = receiveRadio(
            device,
            linkPacket(RELAYED, { snr: 9, rssi: -60, hops: 2 }),
            NOW,
            NONCE
        )
        device = receiveRadio(
            device,
            linkPacket(MQTT, { snr: 12, rssi: -40, hops: 0, viaMqtt: true }),
            NOW,
            NONCE
        )
        expect(device.peers[PEER]).toMatchObject({ snr: 6.5, rssi: -92, hopsAway: 0 })
        expect(device.peers[RELAYED]).toMatchObject({ snr: null, rssi: null, hopsAway: 2 })
        expect(device.peers[MQTT]).toMatchObject({ snr: null, rssi: null, hopsAway: null })
        expect(nearestPeers(device).map((peer) => peer.num)).toEqual([PEER, RELAYED, MQTT])
        expect(bestLink(device)?.num).toBe(PEER)
        expect([signalQuality(6.5), signalQuality(-10), signalQuality(-18)]).toEqual([
            'good',
            'fair',
            'weak',
        ])
    })

    it('ranks direct neighbors by signal before relayed nodes', () => {
        const WEAK = 7777
        let device = localDevice()
        device = receiveRadio(
            device,
            linkPacket(WEAK, { snr: -12, rssi: -118, hops: 0 }),
            NOW,
            NONCE
        )
        device = receiveRadio(device, linkPacket(PEER, { snr: 4, rssi: -95, hops: 0 }), NOW, NONCE)
        expect(nearestPeers(device).map((peer) => peer.num)).toEqual([PEER, WEAK])
    })

    it('formats observation times as local wall-clock time', () => {
        const time = NOW - 60_000
        expect(localTime(time, NOW)).not.toContain('T')
        expect(localTime(time, NOW)).toBe(
            new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(time)
        )
        expect(localTime(NOW - 3 * 86_400_000, NOW)).toBe(
            new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
                NOW - 3 * 86_400_000
            )
        )
    })
})

describe('battery charge from voltage', () => {
    it.each([
        [4.25, 100],
        [4.19, 100],
        [4.05, 90],
        [3.8, 60],
        [3.76, 55],
        [3.1, 0],
        [2.9, 0],
        [2.5, null],
    ])('%s V → %s %%', (volts, expected) => {
        expect(batteryFromVoltage(volts)).toBe(expected)
    })
})

describe('metric history statistics', () => {
    const MINUTE = 60_000
    it('finds extremes, average and the fastest rise and fall per hour', () => {
        const samples = [
            { value: 20, at: 0 },
            { value: 21, at: 30 * MINUTE },
            { value: 23, at: 60 * MINUTE },
            { value: 19, at: 90 * MINUTE },
        ]
        const stats = metricStats(samples)
        expect(stats?.lowest).toEqual(samples[3])
        expect(stats?.highest).toEqual(samples[2])
        expect(stats?.average).toBe(20.75)
        expect(stats?.fastestRise).toEqual({ perHour: 4, from: samples[1], to: samples[2] })
        expect(stats?.fastestFall).toEqual({ perHour: -8, from: samples[2], to: samples[3] })
        expect(stats?.to).toBe(90 * MINUTE)
    })

    it('ignores rates between samples too close together to be meaningful', () => {
        const stats = metricStats([
            { value: 20, at: 0 },
            { value: 25, at: MINUTE },
        ])
        expect(stats?.fastestRise).toBeNull()
        expect(metricStats([])).toBeNull()
    })
})

describe('node kind from MFD names', () => {
    it.each([
        [{ name: 'MFD Sensor 8b79', shortName: 'MFDS' }, 'sensor'],
        [{ name: 'MFD Node 2e53', shortName: 'MFDN' }, 'base'],
        [{ name: 'MFD Test', shortName: 'test' }, 'test'],
        [{ name: 'Ridge relay', shortName: 'MFDC' }, 'cellular'],
        [{ name: 'Meshtastic 2e53', shortName: '2e53' }, null],
        [{ name: 'MFD Garage', shortName: 'GRG' }, null],
    ])('%o → %s', (node, expected) => {
        expect(mfdKind(node)).toBe(expected)
    })
})

describe('our firmware detection', () => {
    it.each([
        [{ name: 'MFD Sensor 8b79', shortName: 'MFDS' }, true],
        [{ name: 'Ridge', shortName: 'MFDN' }, true],
        [{ name: 'Meshtastic 2e53', shortName: '2e53' }, false],
        [{ name: 'MFD Sensor 8b79', shortName: 'MFDS', firmware: '2.7.26.54e0d8d' }, false],
        [{ name: 'Meshtastic 2e53', shortName: '2e53', firmware: '2.7.26.7d798c3' }, true],
    ])('%o → %s', (node, expected) => {
        expect(isMfdNode(node)).toBe(expected)
    })
})

describe('DFU request', () => {
    it('reads the local node number only from myInfo', () => {
        const myInfo = toBinary(
            Mesh.FromRadioSchema,
            create(Mesh.FromRadioSchema, {
                payloadVariant: {
                    case: 'myInfo',
                    value: create(Mesh.MyNodeInfoSchema, { myNodeNum: LOCAL }),
                },
            })
        )
        expect(localNodeNum(myInfo)).toBe(LOCAL)
        expect(localNodeNum(configurationRequest(NONCE))).toBeNull()
        expect(localNodeNum(new Uint8Array([0xff, 0xff]))).toBeNull()
    })

    it('addresses an enter-DFU admin message to the local node', () => {
        const message = fromBinary(Mesh.ToRadioSchema, dfuRequest(LOCAL)).payloadVariant
        expect(message.case).toBe('packet')
        if (message.case !== 'packet') return
        expect(message.value.to).toBe(LOCAL)
        const data = message.value.payloadVariant
        expect(data.case).toBe('decoded')
        if (data.case !== 'decoded') return
        expect(data.value.portnum).toBe(Portnums.PortNum.ADMIN_APP)
        const admin = fromBinary(Admin.AdminMessageSchema, data.value.payload).payloadVariant
        expect(admin).toEqual({ case: 'enterDfuModeRequest', value: true })
    })
})

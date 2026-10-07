import type { Device, Peer, Reading } from '@core/nearby/model'

/** Only display data; connection state and history have their own lifecycles. */
export type Observation = Pick<
    Device,
    'id' | 'nodeNum' | 'lastPacketAt' | 'configuration' | 'peers' | 'activity'
>

const CONFIGURATION = new Set([
    'Meshtastic role',
    'LoRa region',
    'Modem preset',
    'Radio transmission',
    'Device telemetry interval',
    'Environmental telemetry',
    'Environmental interval',
    'Particle telemetry',
    'Particle interval',
])

const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
const number = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)
const time = (value: unknown): value is number | null =>
    value === null || (number(value) && Number.isSafeInteger(value) && value >= 0)
const node = (value: unknown): value is number =>
    number(value) && Number.isSafeInteger(value) && value > 0 && value <= 0xff_ff_ff_ff

function reading(value: unknown): value is Reading {
    return (
        record(value) &&
        typeof value['metric'] === 'string' &&
        number(value['value']) &&
        node(value['sender']) &&
        value['receivedAt'] !== null &&
        time(value['receivedAt']) &&
        time(value['measuredAt']) &&
        typeof value['cached'] === 'boolean'
    )
}

function peer(value: unknown): value is Peer {
    return (
        record(value) &&
        node(value['num']) &&
        typeof value['name'] === 'string' &&
        typeof value['shortName'] === 'string' &&
        typeof value['hardware'] === 'string' &&
        time(value['lastPacketAt']) &&
        time(value['lastHeardAt']) &&
        (value['snr'] === null || number(value['snr'])) &&
        (value['rssi'] === null || number(value['rssi'])) &&
        time(value['hopsAway']) &&
        record(value['readings']) &&
        Object.values(value['readings']).every(reading)
    )
}

/** Strip unknown fields, including any future secret-bearing configuration. */
export function observation(device: Observation): Observation {
    return {
        id: device.id,
        nodeNum: device.nodeNum,
        lastPacketAt: device.lastPacketAt,
        configuration: Object.fromEntries(
            Object.entries(device.configuration).filter(([key]) => CONFIGURATION.has(key))
        ),
        peers: Object.fromEntries(
            Object.values(device.peers).map((entry) => [
                entry.num,
                {
                    num: entry.num,
                    name: entry.name,
                    shortName: entry.shortName,
                    hardware: entry.hardware,
                    lastPacketAt: entry.lastPacketAt,
                    lastHeardAt: entry.lastHeardAt,
                    snr: entry.snr,
                    rssi: entry.rssi,
                    hopsAway: entry.hopsAway,
                    readings: Object.fromEntries(
                        Object.values(entry.readings).map((value) => [
                            value.metric,
                            {
                                metric: value.metric,
                                value: value.value,
                                sender: value.sender,
                                receivedAt: value.receivedAt,
                                measuredAt: value.measuredAt,
                                cached: value.cached,
                            },
                        ])
                    ),
                },
            ])
        ),
        activity: device.activity.map(({ at, message }) => ({ at, message })),
    }
}

export function parseObservation(value: unknown): Observation | null {
    return !record(value) ||
        typeof value['id'] !== 'string' ||
        !(value['nodeNum'] === null || node(value['nodeNum'])) ||
        !time(value['lastPacketAt']) ||
        !record(value['configuration']) ||
        Object.values(value['configuration']).some((entry) => typeof entry !== 'string') ||
        !record(value['peers']) ||
        !Object.values(value['peers']).every(peer) ||
        !Array.isArray(value['activity']) ||
        value['activity'].some(
            (entry: unknown) =>
                !(
                    record(entry) &&
                    entry['at'] !== null &&
                    time(entry['at']) &&
                    typeof entry['message'] === 'string'
                )
        )
        ? null
        : observation(value as Observation)
}

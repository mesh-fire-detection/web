import type { MetricHistory } from '@core/nearby/metrics'
import { emptyDevice, RECENT_CONNECTION_MS, TRANSPORTS } from '@core/nearby/model'
import type { Device, History, Reading, Sample, Transport } from '@core/nearby/model'

const STORAGE_KEY = 'mesh-fire-detection.nearby-devices.v1'

type RememberedDevice = Pick<Device, 'id' | 'bluetoothName' | 'name' | 'nodeNum'> &
    /** Missing in saves from before hardware and firmware were kept. */
    Partial<Pick<Device, 'shortName' | 'hardware' | 'firmware' | 'port'>> & {
        /** Missing in saves from before USB support, which were all Bluetooth. */
        readonly transport?: Transport
        readonly connectedAt?: number | null
        /**
         * Earlier saves kept history here (`voltageHistory` before that). It is read
         * once so the session can move it into IndexedDB, and is no longer written.
         */
        readonly history?: History
        readonly voltageHistory?: readonly Sample[]
        /** The latest local reading per metric, shown again after a reload. */
        readonly readings?: readonly Reading[]
    }
type RememberedDevices = {
    readonly version: 1
    readonly devices: readonly RememberedDevice[]
    readonly activeId: string | null
}

/** Widened so an unchecked stored value can be looked up. */
const STORED_TRANSPORTS: readonly unknown[] = TRANSPORTS

const EMPTY: RememberedDevices = { version: 1, devices: [], activeId: null }

function isSample(value: unknown): value is Sample {
    return (
        typeof value === 'object' &&
        value !== null &&
        'value' in value &&
        typeof value.value === 'number' &&
        Number.isFinite(value.value) &&
        'at' in value &&
        typeof value.at === 'number' &&
        Number.isSafeInteger(value.at) &&
        value.at > 0
    )
}

const isTime = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value > 0

function isReading(value: unknown): value is Reading {
    return (
        typeof value === 'object' &&
        value !== null &&
        'metric' in value &&
        typeof value.metric === 'string' &&
        value.metric.length > 0 &&
        'value' in value &&
        typeof value.value === 'number' &&
        Number.isFinite(value.value) &&
        'sender' in value &&
        isTime(value.sender) &&
        'receivedAt' in value &&
        isTime(value.receivedAt) &&
        'measuredAt' in value &&
        (value.measuredAt === null || isTime(value.measuredAt)) &&
        'cached' in value &&
        typeof value.cached === 'boolean'
    )
}

function isHistory(value: unknown): value is History {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.values(value).every((samples) => Array.isArray(samples) && samples.every(isSample))
    )
}

const copySamples = (samples: readonly Sample[]) =>
    samples.map((sample) => ({ value: sample.value, at: sample.at }))

function isRememberedDevice(value: unknown): value is RememberedDevice {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'string' &&
        value.id.length > 0 &&
        'bluetoothName' in value &&
        typeof value.bluetoothName === 'string' &&
        'name' in value &&
        typeof value.name === 'string' &&
        (!('shortName' in value) || typeof value.shortName === 'string') &&
        (!('hardware' in value) || typeof value.hardware === 'string') &&
        (!('firmware' in value) || typeof value.firmware === 'string') &&
        (!('connectedAt' in value) ||
            value.connectedAt === null ||
            (typeof value.connectedAt === 'number' &&
                Number.isSafeInteger(value.connectedAt) &&
                value.connectedAt >= 0)) &&
        (!('transport' in value) || STORED_TRANSPORTS.includes(value.transport)) &&
        (!('port' in value) || value.port === null || typeof value.port === 'string') &&
        (!('readings' in value) ||
            (Array.isArray(value.readings) && value.readings.every(isReading))) &&
        (!('voltageHistory' in value) ||
            (Array.isArray(value.voltageHistory) && value.voltageHistory.every(isSample))) &&
        (!('history' in value) || isHistory(value.history)) &&
        'nodeNum' in value &&
        (value.nodeNum === null ||
            (typeof value.nodeNum === 'number' &&
                Number.isSafeInteger(value.nodeNum) &&
                value.nodeNum > 0 &&
                value.nodeNum <= 0xff_ff_ff_ff))
    )
}

export function createDeviceMemory(storage: () => Pick<Storage, 'getItem' | 'setItem'>) {
    let previous = ''
    return {
        read(): RememberedDevices {
            try {
                const value: unknown = JSON.parse(storage().getItem(STORAGE_KEY) ?? 'null')
                if (
                    typeof value !== 'object' ||
                    value === null ||
                    !('version' in value) ||
                    value.version !== 1 ||
                    !('devices' in value) ||
                    !Array.isArray(value.devices) ||
                    !value.devices.every(isRememberedDevice) ||
                    !('activeId' in value) ||
                    (value.activeId !== null && typeof value.activeId !== 'string')
                )
                    return EMPTY
                const devices = value.devices.filter(
                    (device, index, all) =>
                        all.findIndex((entry) => entry.id === device.id) === index
                )
                return {
                    version: 1,
                    devices: devices.map(
                        ({
                            id,
                            bluetoothName,
                            name,
                            nodeNum,
                            connectedAt,
                            history,
                            voltageHistory,
                            readings,
                            transport,
                            port,
                            shortName,
                            hardware,
                            firmware,
                        }) => ({
                            id,
                            bluetoothName,
                            name,
                            nodeNum,
                            ...(shortName !== undefined && { shortName }),
                            ...(hardware !== undefined && { hardware }),
                            ...(firmware !== undefined && { firmware }),
                            ...(transport !== undefined && { transport }),
                            ...(port !== undefined && { port }),
                            ...(connectedAt !== undefined && { connectedAt }),
                            ...((history !== undefined || voltageHistory !== undefined) && {
                                history: Object.fromEntries(
                                    Object.entries({
                                        ...(voltageHistory && {
                                            'deviceMetrics.voltage': voltageHistory,
                                        }),
                                        ...history,
                                    }).map(([metric, samples]) => [metric, copySamples(samples)])
                                ),
                            }),
                            ...(readings !== undefined && {
                                readings: readings.map((reading) => ({
                                    metric: reading.metric,
                                    value: reading.value,
                                    sender: reading.sender,
                                    receivedAt: reading.receivedAt,
                                    measuredAt: reading.measuredAt,
                                    cached: reading.cached,
                                })),
                            }),
                        })
                    ),
                    activeId: devices.some((device) => device.id === value.activeId)
                        ? value.activeId
                        : null,
                }
            } catch {
                return EMPTY
            }
        },
        write(devices: readonly Device[], activeId: string | null): void {
            const value: RememberedDevices = {
                version: 1,
                devices: devices.map(
                    ({
                        id,
                        bluetoothName,
                        name,
                        nodeNum,
                        shortName,
                        hardware,
                        firmware,
                        connectedAt,
                        readings,
                        transport,
                        port,
                    }) => ({
                        id,
                        bluetoothName,
                        name,
                        nodeNum,
                        shortName,
                        hardware,
                        firmware,
                        transport,
                        port,
                        connectedAt,
                        readings: Object.values(readings),
                    })
                ),
                activeId,
            }
            const serialized = JSON.stringify(value)
            if (serialized === previous) return
            try {
                storage().setItem(STORAGE_KEY, serialized)
                previous = serialized
            } catch {
                // Storage restrictions leave the current page session usable.
            }
        },
    }
}

export type DeviceMemory = ReturnType<typeof createDeviceMemory>

/**
 * A metric's history as this browser keeps it in IndexedDB: up to 100 days, one
 * sample per five minutes, recorded only while a page is connected. The backend
 * stores readings under the same metric names (`GET /v1/devices/:id/readings`),
 * but only for registered devices heard through an MQTT gateway, keyed by device
 * ID rather than node number, behind sign-in, and it may not always run. The page
 * works from this browser alone; a server source returning this same shape can
 * add longer, gap-free history when one is reachable.
 */
export function browserHistory(device: Pick<Device, 'history'>, metric: string): MetricHistory {
    return { source: 'browser', samples: device.history[metric] ?? [] }
}

export function restoreDevices(
    saved: ReturnType<DeviceMemory['read']>['devices']
): readonly Device[] {
    const now = Date.now()
    return saved.map((device) => {
        const connectedAt = device.connectedAt ?? null
        const recentUntil =
            connectedAt !== null && connectedAt <= now && now < connectedAt + RECENT_CONNECTION_MS
                ? connectedAt + RECENT_CONNECTION_MS
                : null
        const readings = device.readings ?? []
        return {
            ...emptyDevice(device.id, device.bluetoothName, device.transport ?? 'bluetooth'),
            name: device.name,
            nodeNum: device.nodeNum,
            shortName: device.shortName ?? '',
            hardware: device.hardware ?? '',
            firmware: device.firmware ?? '',
            port: device.port ?? null,
            connectedAt,
            recentUntil,
            lastPacketAt:
                readings.length === 0
                    ? null
                    : Math.max(...readings.map((reading) => reading.receivedAt)),
            history: device.history ?? {},
            readings: Object.fromEntries(readings.map((reading) => [reading.metric, reading])),
        }
    })
}

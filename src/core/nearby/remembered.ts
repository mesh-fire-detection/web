import type { Device, History, Reading, Sample } from '@core/nearby/model'

const STORAGE_KEY = 'mesh-fire-detection.nearby-devices.v1'

type RememberedDevice = Pick<Device, 'id' | 'bluetoothName' | 'name' | 'nodeNum'> & {
    readonly connectedAt?: number | null
    /** Kept across reloads so trends survive disconnection. */
    readonly history?: History
    /** Earlier saves kept only battery voltage; read into `history` on load. */
    readonly voltageHistory?: readonly Sample[]
    /** The latest local reading per metric, shown again after a reload. */
    readonly readings?: readonly Reading[]
}
type RememberedDevices = {
    readonly version: 1
    readonly devices: readonly RememberedDevice[]
    readonly activeId: string | null
}

const EMPTY: RememberedDevices = { version: 1, devices: [], activeId: null }

function isSample(value: unknown): value is Sample {
    return (
        typeof value === 'object' &&
        value !== null &&
        'value' in value &&
        typeof value.value === 'number' &&
        Number.isFinite(value.value) &&
        value.value > 0 &&
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
        (!('connectedAt' in value) ||
            value.connectedAt === null ||
            (typeof value.connectedAt === 'number' &&
                Number.isSafeInteger(value.connectedAt) &&
                value.connectedAt >= 0)) &&
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
                        }) => ({
                            id,
                            bluetoothName,
                            name,
                            nodeNum,
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
                    ({ id, bluetoothName, name, nodeNum, connectedAt, history, readings }) => ({
                        id,
                        bluetoothName,
                        name,
                        nodeNum,
                        connectedAt,
                        history,
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

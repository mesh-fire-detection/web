import type { MetricHistory } from '@core/nearby/metrics'
import { emptyNode, RECENT_CONNECTION_MS, TRANSPORTS } from '@core/nearby/model'
import type { NearbyNode, History, Reading, Sample, Transport } from '@core/nearby/model'

const STORAGE_KEY = 'mesh-fire-detection.nearby-devices.v1'

type RememberedNode = Pick<NearbyNode, 'id' | 'bluetoothName' | 'name' | 'nodeNum'> &
    /** Missing in saves from before hardware and firmware were kept. */
    Partial<Pick<NearbyNode, 'shortName' | 'hardware' | 'firmware' | 'port'>> & {
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
type RememberedNodes = {
    readonly version: 1
    readonly nodes: readonly RememberedNode[]
    readonly activeId: string | null
}
/**
 * As saved. The list kept its old name, `devices`, with the storage key: renaming
 * either would forget every node a browser has saved.
 */
type SavedNodes = Omit<RememberedNodes, 'nodes'> & { readonly devices: readonly RememberedNode[] }

/** Widened so an unchecked stored value can be looked up. */
const STORED_TRANSPORTS: readonly unknown[] = TRANSPORTS

const EMPTY: RememberedNodes = { version: 1, nodes: [], activeId: null }

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

function isRememberedNode(value: unknown): value is RememberedNode {
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

export function createNodeMemory(storage: () => Pick<Storage, 'getItem' | 'setItem'>) {
    let previous = ''
    return {
        read(): RememberedNodes {
            try {
                const value: unknown = JSON.parse(storage().getItem(STORAGE_KEY) ?? 'null')
                if (
                    typeof value !== 'object' ||
                    value === null ||
                    !('version' in value) ||
                    value.version !== 1 ||
                    !('devices' in value) ||
                    !Array.isArray(value.devices) ||
                    !value.devices.every(isRememberedNode) ||
                    !('activeId' in value) ||
                    (value.activeId !== null && typeof value.activeId !== 'string')
                )
                    return EMPTY
                const nodes = value.devices.filter(
                    (node, index, all) => all.findIndex((entry) => entry.id === node.id) === index
                )
                return {
                    version: 1,
                    nodes: nodes.map(
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
                    activeId: nodes.some((node) => node.id === value.activeId)
                        ? value.activeId
                        : null,
                }
            } catch {
                return EMPTY
            }
        },
        write(nodes: readonly NearbyNode[], activeId: string | null): void {
            const value: SavedNodes = {
                version: 1,
                devices: nodes.map(
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

export type NodeMemory = ReturnType<typeof createNodeMemory>

/**
 * A metric's history as this browser keeps it in IndexedDB: up to 100 days, one
 * sample per five minutes, recorded only while a page is connected. The backend
 * stores readings under the same metric names (`GET /v1/nodes/:id/readings`),
 * but only for registered nodes heard through an MQTT gateway, keyed by node
 * ID rather than node number, behind sign-in, and it may not always run. The page
 * works from this browser alone; a server source returning this same shape can
 * add longer, gap-free history when one is reachable.
 */
export function browserHistory(node: Pick<NearbyNode, 'history'>, metric: string): MetricHistory {
    return { source: 'browser', samples: node.history[metric] ?? [] }
}

export function restoreNodes(
    saved: ReturnType<NodeMemory['read']>['nodes']
): readonly NearbyNode[] {
    const now = Date.now()
    return saved.map((node) => {
        const connectedAt = node.connectedAt ?? null
        const recentUntil =
            connectedAt !== null && connectedAt <= now && now < connectedAt + RECENT_CONNECTION_MS
                ? connectedAt + RECENT_CONNECTION_MS
                : null
        const readings = node.readings ?? []
        return {
            ...emptyNode(node.id, node.bluetoothName, node.transport ?? 'bluetooth'),
            name: node.name,
            nodeNum: node.nodeNum,
            shortName: node.shortName ?? '',
            hardware: node.hardware ?? '',
            firmware: node.firmware ?? '',
            port: node.port ?? null,
            connectedAt,
            recentUntil,
            lastPacketAt:
                readings.length === 0
                    ? null
                    : Math.max(...readings.map((reading) => reading.receivedAt)),
            history: node.history ?? {},
            readings: Object.fromEntries(readings.map((reading) => [reading.metric, reading])),
        }
    })
}

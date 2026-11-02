import type { DeviceMetrics, Node, Reading as ServerReading } from '@core/api/nodes'
import { emptyNode } from '@core/nearby/model'
import type { NearbyNode, Reading, Sample } from '@core/nearby/model'

type Sampled = Sample & { readonly metric: string }

/** Device reports hold several values in a row; the readings they become keep the mesh's names. */
const DEVICE_METRICS = [
    ['batteryPct', 'deviceMetrics.batteryLevel'],
    ['voltage', 'deviceMetrics.voltage'],
    ['uptimeS', 'deviceMetrics.uptimeSeconds'],
] as const

function samples(readings: readonly ServerReading[], metrics: readonly DeviceMetrics[]): Sampled[] {
    return [
        ...readings.map((reading) => ({
            metric: reading.metric,
            value: reading.value,
            at: Date.parse(reading.recordedAt),
        })),
        ...metrics.flatMap((row) =>
            DEVICE_METRICS.flatMap(([field, metric]) => {
                const value = row[field]
                return value === null ? [] : [{ metric, value, at: Date.parse(row.recordedAt) }]
            })
        ),
    ].toSorted((left, right) => left.at - right.at)
}

/**
 * What the server knows of a node, in the shape `/connect`'s components read,
 * so one view shows both. It was heard through the network: never "connected".
 */
export function serverNode(
    node: Node,
    readings: readonly ServerReading[],
    metrics: readonly DeviceMetrics[]
): NearbyNode {
    const nodeNum = Number.parseInt(node.meshId.slice(1), 16)
    const latest: Record<string, Reading> = {}
    const history: Record<string, Sample[]> = {}
    for (const sample of samples(readings, metrics)) {
        latest[sample.metric] = {
            metric: sample.metric,
            value: sample.value,
            sender: nodeNum,
            receivedAt: sample.at,
            measuredAt: sample.at,
            cached: false,
        }
        history[sample.metric] = [...(history[sample.metric] ?? []), sample]
    }
    return {
        ...emptyNode(node.id, node.name),
        nodeNum,
        name: node.name,
        firmware: node.firmware ?? '',
        hardware: node.details?.hardware ?? '',
        hardwareId: node.details?.hardwareId ?? '',
        lastPacketAt: node.lastHeardAt === null ? null : Date.parse(node.lastHeardAt),
        readings: latest,
        history,
    }
}

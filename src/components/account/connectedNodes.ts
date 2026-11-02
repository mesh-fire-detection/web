import { useEffect, useState } from 'react'

import type { NodeReport } from '@core/api/people'
import { mfdKind } from '@core/nearby/firmware'
import type { NearbyNode } from '@core/nearby/model'
import { createNodeMemory } from '@core/nearby/storage/nodes'

type Remembered = Pick<NearbyNode, 'nodeNum' | 'name'> &
    Partial<Pick<NearbyNode, 'shortName' | 'hardware' | 'hardwareId' | 'firmware'>>

const orNull = (value: string | undefined): string | null =>
    value === undefined || value.trim() === '' ? null : value

/** The type our firmware's naming implies. A bench test board registers without one. */
function registeredType(node: Remembered): NodeReport['type'] {
    const kind = mfdKind({ name: node.name, shortName: node.shortName ?? '' })
    return kind === null || kind === 'test' ? null : kind
}

/**
 * The nodes this browser has connected and identified, one per node number.
 * A node added but never connected has no number and is not a node yet.
 */
export function toNodeReports(nodes: readonly Remembered[]): NodeReport[] {
    const seen = new Set<number>()
    const reports: NodeReport[] = []
    for (const node of nodes) {
        if (node.nodeNum === null || seen.has(node.nodeNum)) continue
        seen.add(node.nodeNum)
        reports.push({
            nodeNum: node.nodeNum,
            name: orNull(node.name),
            hardware: orNull(node.hardware),
            firmware: orNull(node.firmware),
            hardwareId: orNull(node.hardwareId),
            type: registeredType(node),
        })
    }
    return reports
}

/**
 * What `/connect` has remembered in this browser. Nothing here is sent
 * anywhere until the person becomes a member and asks for it (backend#9).
 */
function readConnectedNodes(): NodeReport[] {
    try {
        return toNodeReports(createNodeMemory(() => window.localStorage).read().nodes)
    } catch {
        // Private mode or blocked storage: as if nothing had been connected.
        return []
    }
}

/**
 * The connected nodes, kept current. `/connect` opens in a tab of its own, so
 * a node connected there reaches the footer in this tab through the `storage`
 * event, which fires only in the other tabs.
 */
export function useConnectedNodes(): readonly NodeReport[] {
    const [nodes, setNodes] = useState(readConnectedNodes)

    useEffect(() => {
        const refresh = () => {
            setNodes(readConnectedNodes())
        }
        window.addEventListener('storage', refresh)
        return () => {
            window.removeEventListener('storage', refresh)
        }
    }, [])

    return nodes
}

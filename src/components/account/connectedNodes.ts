import { useEffect, useState } from 'react'

import type { NodeReport } from '@core/api/people'
import type { Device } from '@core/nearby/model'
import { createDeviceMemory } from '@core/nearby/storage/devices'

type Remembered = Pick<Device, 'nodeNum' | 'name'> &
    Partial<Pick<Device, 'hardware' | 'firmware' | 'connectedAt'>>

const orNull = (value: string | undefined): string | null =>
    value === undefined || value.trim() === '' ? null : value

/**
 * The nodes this browser has connected and identified, one per node number.
 * A device added but never connected has no number and is not a node yet.
 */
export function toNodeReports(devices: readonly Remembered[]): NodeReport[] {
    const seen = new Set<number>()
    const reports: NodeReport[] = []
    for (const device of devices) {
        if (device.nodeNum === null || seen.has(device.nodeNum)) continue
        seen.add(device.nodeNum)
        reports.push({
            nodeNum: device.nodeNum,
            name: orNull(device.name),
            hardware: orNull(device.hardware),
            firmware: orNull(device.firmware),
            connectedAt:
                device.connectedAt == null ? null : new Date(device.connectedAt).toISOString(),
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
        return toNodeReports(createDeviceMemory(() => window.localStorage).read().devices)
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

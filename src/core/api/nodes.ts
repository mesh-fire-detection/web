import { apiRequest, type ApiResult } from '@core/api/client'

export type NodeType = 'base' | 'cellular' | 'sensor' | 'vision'
/** What a node does, from what it has shown (backend#51). `base` only relays. */
export type NodeRole = 'base' | 'gateway' | 'sensor' | 'vision'

/** One way a node's data reaches the backend, the most recently used first. */
export type NodeConnection = {
    readonly via: 'mesh' | 'mqtt' | 'notecard' | 'browser'
    /** Null when it isn't known, such as a Notecard before Notehub has said. */
    readonly network: 'wifi' | 'cellular' | 'satellite' | null
    readonly lastUsedAt: string | null
    /** For `mesh`: the gateway that delivered the node's packets. */
    readonly gatewayId?: string
}

type Signal = { readonly snr: number; readonly rssi: number | null; readonly at: string }
type NodeRef = { readonly id: string; readonly name: string }

/**
 * How one node's packets reach the server, and the nodes around it, from the
 * last 7 days. The mesh records how many hops a packet took, not which relays.
 */
export type NodePath = {
    readonly deliveries: readonly {
        /** The node itself when it is a gateway delivering its own packets. */
        readonly gateway: NodeRef
        readonly hops: number | null
        readonly lastAt: string
        /** The gateway's reading of this node, when it heard it directly. */
        readonly signal: Signal | null
        /** How the gateway reaches the server. */
        readonly connections: readonly NodeConnection[]
    }[]
    readonly nearby: readonly {
        readonly node: NodeRef
        /** This node hearing the other one. */
        readonly hears: Signal | null
        /** The other node hearing this one. */
        readonly heardBy: Signal | null
    }[]
}
export type NodeStatus = 'online' | 'degraded' | 'offline'
/** [longitude, latitude], GeoJSON order. */
type Position = readonly [number, number]

/**
 * A registered node as any signed-in person sees it. `position` is
 * approximate (about 1 km) unless the node is yours or its people chose to
 * show it exactly; the page shows what it is given and nothing else.
 */
export type Node = {
    /** Assigned by the server when the node was registered, and never changed. */
    readonly id: string
    readonly meshId: string
    readonly name: string
    /** What its people chose; `roles` is what it has shown. */
    readonly type: NodeType | null
    readonly roles: readonly NodeRole[]
    readonly connections: readonly NodeConnection[]
    readonly status: NodeStatus
    readonly position: Position | null
    readonly approximate: boolean
    readonly elevationM: number | null
    readonly antennaHeightM: number | null
    readonly firmware: string | null
    readonly deployedOn: string | null
    readonly batteryPct: number | null
    readonly lastHeardAt: string | null
    readonly enabled: boolean
    /** Whether the caller is on this node. Nothing says who else is. */
    readonly mine: boolean
    /** Only for the people on the node and admins: the ones who may edit it. */
    readonly details: {
        readonly position: Position | null
        readonly elevationM: number | null
        readonly exactPosition: boolean
        readonly hardware: string | null
        readonly hardwareId: string | null
        readonly note: string | null
        /** What the node said when a browser last connected to it. */
        readonly shortName: string | null
        readonly settings: Readonly<Record<string, string>> | null
        readonly settingsReportedAt: string | null
        /** Display names, for the people on the node and admins. */
        readonly owners: readonly {
            readonly name: string
            readonly addedAt: string
            readonly you: boolean
        }[]
        readonly reported: {
            readonly name: string | null
            readonly position: Position | null
            readonly altitudeM: number | null
            readonly at: string
        } | null
        readonly createdAt: string
        readonly updatedAt: string
    } | null
}

/**
 * What the people on a node may change. The mesh ID and enabling are for admins,
 * and firmware is recorded from what the node reports.
 */
export type NodeChanges = {
    readonly name: string
    readonly type: NodeType | null
    readonly position: Position | null
    readonly elevationM: number | null
    readonly antennaHeightM: number | null
    readonly deployedOn: string | null
    readonly note: string | null
    readonly exactPosition: boolean
}

export type Reading = {
    readonly metric: string
    readonly value: number
    readonly recordedAt: string
}

export type DeviceMetrics = {
    readonly batteryPct: number | null
    readonly voltage: number | null
    readonly uptimeS: number | null
    readonly recordedAt: string
}

export type NodeEventKind = 'connected' | 'disconnected' | 'restarted' | 'malformed'

export type NodeEvent = {
    readonly kind: NodeEventKind
    readonly at: string
}

/** What a browser kept from `/connect`, sent for a node on the person's account. */
export type NodeUpload = {
    readonly readings?: readonly {
        readonly metric: string
        readonly value: number
        /** The sensor's time in whole seconds, or when the browser received it. */
        readonly at: string
    }[]
    readonly events?: readonly NodeEvent[]
    readonly connection?: {
        readonly shortName: string | null
        readonly settings: Readonly<Record<string, string>>
        readonly at: string
    }
}

export type UploadResult = {
    readonly readings: number
    readonly events: number
    readonly skipped: number
}

/** A node as a backend from before roles (backend#51) sends it. */
type ServerNode = Omit<Node, 'roles' | 'connections'> & Partial<Pick<Node, 'roles' | 'connections'>>

/** Roles from the chosen type, until the backend that sends them is deployed. */
function withRoles(node: ServerNode): Node {
    const chosen: readonly NodeRole[] =
        node.type === null ? [] : [node.type === 'cellular' ? 'gateway' : node.type]
    return { ...node, roles: node.roles ?? chosen, connections: node.connections ?? [] }
}

export async function fetchNodes(): Promise<ApiResult<readonly Node[]>> {
    const result = await apiRequest<{ nodes: ServerNode[] }>('/v1/nodes')
    return result.ok ? { ok: true, data: result.data.nodes.map((node) => withRoles(node)) } : result
}

/** `not_found` both for an unknown node and for one the caller may not see. */
export async function fetchNode(id: string): Promise<ApiResult<Node>> {
    const result = await apiRequest<{ node: ServerNode }>(`/v1/nodes/${encodeURIComponent(id)}`)
    return result.ok ? { ok: true, data: withRoles(result.data.node) } : result
}

export function fetchNodePath(id: string): Promise<ApiResult<NodePath>> {
    return apiRequest<NodePath>(`/v1/nodes/${encodeURIComponent(id)}/path`)
}

export async function updateNode(id: string, changes: NodeChanges): Promise<ApiResult<Node>> {
    const result = await apiRequest<{ node: ServerNode }>(`/v1/nodes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: changes,
    })
    return result.ok ? { ok: true, data: withRoles(result.data.node) } : result
}

/** Sending the same thing twice stores it once. */
export function uploadNodeData(id: string, body: NodeUpload): Promise<ApiResult<UploadResult>> {
    return apiRequest<UploadResult>(`/v1/nodes/${encodeURIComponent(id)}/upload`, {
        method: 'POST',
        body,
    })
}

/** Newest first; `not_found` for anyone but the node's people and admins. */
export async function fetchNodeEvents(id: string): Promise<ApiResult<readonly NodeEvent[]>> {
    const result = await apiRequest<{ events: NodeEvent[] }>(
        `/v1/nodes/${encodeURIComponent(id)}/events`
    )
    return result.ok ? { ok: true, data: result.data.events } : result
}

const DAY_MS = 24 * 60 * 60 * 1000
/**
 * A response stops at 10,000 rows, oldest first, so a truncated one is missing
 * the newest readings. A chatty node falls back to a shorter range.
 */
const HISTORY_RANGES_MS = [7 * DAY_MS, DAY_MS, DAY_MS / 24] as const

async function newestRange<Body extends { readonly truncated: boolean }>(
    path: `/${string}`,
    ranges: readonly number[] = HISTORY_RANGES_MS
): Promise<ApiResult<Body>> {
    const [range = DAY_MS, ...shorter] = ranges
    const from = new Date(Date.now() - range).toISOString()
    const result = await apiRequest<Body>(`${path}?from=${encodeURIComponent(from)}`)
    return result.ok && result.data.truncated && shorter.length > 0
        ? newestRange<Body>(path, shorter)
        : result
}

/** Recent sensor readings, oldest first. */
export async function fetchReadings(id: string): Promise<ApiResult<readonly Reading[]>> {
    const result = await newestRange<{ readings: Reading[]; truncated: boolean }>(
        `/v1/nodes/${encodeURIComponent(id)}/readings`
    )
    return result.ok ? { ok: true, data: result.data.readings } : result
}

/** Recent battery, voltage and uptime reports, oldest first. */
export async function fetchDeviceMetrics(id: string): Promise<ApiResult<readonly DeviceMetrics[]>> {
    const result = await newestRange<{ metrics: DeviceMetrics[]; truncated: boolean }>(
        `/v1/nodes/${encodeURIComponent(id)}/metrics`
    )
    return result.ok ? { ok: true, data: result.data.metrics } : result
}

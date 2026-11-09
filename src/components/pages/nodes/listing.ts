import type { Node, NodeRole, NodeStatus, NodeType } from '@core/api/nodes'

export const NODE_TYPES = ['base', 'cellular', 'sensor', 'vision'] as const satisfies NodeType[]
export const NODE_ROLES = ['gateway', 'sensor', 'base', 'vision'] as const satisfies NodeRole[]
export const NODE_STATUSES = ['online', 'degraded', 'offline'] as const satisfies NodeStatus[]
const SORT_KEYS = ['name', 'role', 'status', 'battery', 'heard'] as const
export type SortKey = (typeof SORT_KEYS)[number]
type Direction = 'ascending' | 'descending'

export const STATUS_KIND = { online: 'live', degraded: 'warn', offline: 'dead' } as const

/** The map focused on these nodes; only those with a position can be shown there. */
export function mapLink(nodes: readonly Pick<Node, 'id' | 'position'>[]): string | null {
    const placed = nodes.filter((node) => node.position !== null)
    return placed.length === 0
        ? null
        : `/map?nodes=${placed.map((node) => encodeURIComponent(node.id)).join(',')}`
}

type NodeUse = 'field' | 'quiet' | 'unused'

/** What the network knows of a node: hearing it is the only evidence it is out there. */
export function nodeUse(node: Pick<Node, 'enabled' | 'lastHeardAt' | 'status'>): NodeUse {
    if (!node.enabled || node.lastHeardAt === null) return 'unused'
    return node.status === 'offline' ? 'quiet' : 'field'
}

/** Quietest first when ascending, so the nodes that need a visit come to the top. */
const STATUS_RANK: Record<NodeStatus, number> = { offline: 0, degraded: 1, online: 2 }

/** The list's filters and sort, all kept in the URL so a filtered view can be shared. */
export type Filters = {
    readonly mine: boolean
    readonly role: NodeRole | null
    readonly status: NodeStatus | null
    readonly query: string
    readonly sort: SortKey | null
    readonly direction: Direction
}

const oneOf = <T extends string>(values: readonly T[], raw: string | null): T | null =>
    values.find((value) => value === raw) ?? null

/** A link from before roles said `type=`; `cellular` was a gateway. */
function legacyRole(raw: string | null): NodeRole | null {
    return raw === 'cellular' ? 'gateway' : oneOf(NODE_ROLES, raw)
}

/** Anything the URL does not say, or says wrongly, falls back to the default. */
export function readFilters(params: URLSearchParams): Filters {
    return {
        mine: params.get('mine') === '1',
        role: oneOf(NODE_ROLES, params.get('role')) ?? legacyRole(params.get('type')),
        status: oneOf(NODE_STATUSES, params.get('status')),
        query: params.get('q')?.trim() ?? '',
        sort: oneOf(SORT_KEYS, params.get('sort')),
        direction: params.get('dir') === 'desc' ? 'descending' : 'ascending',
    }
}

/** Only what differs from the default, so an unfiltered list has a clean URL. */
export function writeFilters(filters: Filters): URLSearchParams {
    const params = new URLSearchParams()
    if (filters.mine) params.set('mine', '1')
    if (filters.role !== null) params.set('role', filters.role)
    if (filters.status !== null) params.set('status', filters.status)
    if (filters.query !== '') params.set('q', filters.query)
    if (filters.sort !== null) {
        params.set('sort', filters.sort)
        if (filters.direction === 'descending') params.set('dir', 'desc')
    }
    return params
}

export const isFiltered = (filters: Filters): boolean =>
    filters.mine || filters.role !== null || filters.status !== null || filters.query !== ''

/** A column heading pressed: sorts by it, or reverses it when it is already the sort. */
export const toggleSort = (filters: Filters, key: SortKey): Filters => ({
    ...filters,
    sort: key,
    direction:
        filters.sort === key && filters.direction === 'ascending' ? 'descending' : 'ascending',
})

export const isSortKey = (key: string): key is SortKey => oneOf(SORT_KEYS, key) !== null

/** Whole minutes since a timestamp, or null for never. */
export function minutesSince(at: string | null, now: number): number | null {
    return at === null ? null : Math.max(0, Math.floor((now - Date.parse(at)) / 60_000))
}

export function sortValue(node: Node, key: SortKey, now: number): string | number | null {
    switch (key) {
        case 'name': {
            return node.name
        }
        case 'role': {
            // Listed by its first role, in the order the filter offers them.
            const first = NODE_ROLES.findIndex((role) => node.roles.includes(role))
            return first === -1 ? null : first
        }
        case 'status': {
            return STATUS_RANK[node.status]
        }
        case 'battery': {
            return node.batteryPct
        }
        case 'heard': {
            // Never heard is the quietest of all.
            return minutesSince(node.lastHeardAt, now) ?? Infinity
        }
    }
}

function compare(left: string | number | null, right: string | number | null): number {
    if (left === right) return 0
    if (left === null) return 1
    if (right === null) return -1
    return typeof left === 'string' && typeof right === 'string'
        ? left.localeCompare(right)
        : Number(left) - Number(right)
}

/** The nodes the filters let through, in the order asked for; ties go by name. */
export function listNodes(nodes: readonly Node[], filters: Filters, now: number): Node[] {
    const query = filters.query.toLocaleLowerCase()
    const shown = nodes.filter(
        (node) =>
            (!filters.mine || node.mine) &&
            (filters.role === null || node.roles.includes(filters.role)) &&
            (filters.status === null || node.status === filters.status) &&
            (query === '' || `${node.id} ${node.name}`.toLocaleLowerCase().includes(query))
    )
    const { sort } = filters
    if (sort === null) return shown

    const sign = filters.direction === 'descending' ? -1 : 1
    return shown.toSorted((left, right) => {
        const leftValue = sortValue(left, sort, now)
        const rightValue = sortValue(right, sort, now)
        // Missing values stay last whichever way the column runs.
        return leftValue === null || rightValue === null
            ? compare(leftValue, rightValue)
            : sign * compare(leftValue, rightValue) || left.name.localeCompare(right.name)
    })
}

import type { Node, NodeRole, NodeStatus, NodeType } from '@core/api/nodes'
import { nodesContent } from '@core/content/nodes/nodes'
import { sinceMinutes } from '@core/format/format'
import { duration } from '@core/nearby/metrics'

export const NODE_TYPES = ['base', 'cellular', 'sensor', 'vision'] as const satisfies NodeType[]
export const NODE_ROLES = ['gateway', 'sensor', 'base', 'vision'] as const satisfies NodeRole[]
export const NODE_STATUSES = ['online', 'late', 'offline'] as const satisfies NodeStatus[]
const SORT_KEYS = ['name', 'role', 'status', 'battery', 'heard'] as const
export type SortKey = (typeof SORT_KEYS)[number]
type Direction = 'ascending' | 'descending'

export const STATUS_KIND = { online: 'live', late: 'warn', offline: 'dead' } as const

/**
 * Whether what a node last said still describes it now. Plugged in, charging,
 * a low battery and the path it is heard by are said in the present tense only
 * while it is heard; an offline node gets what it last said and when.
 */
export function isCurrent(node: Pick<Node, 'status'>): boolean {
    return node.status !== 'offline'
}

/**
 * How the node was last heard, for beside its status: `via browser`, `via
 * Ridge gateway`, or a gateway's own `via Wi-Fi`; `last via` once it is
 * offline. Null before it is heard.
 */
export function heardViaText(node: Pick<Node, 'heardVia' | 'status'>): string | null {
    const { heardVia } = node
    if (heardVia === null) return null
    const { power, connections } = nodesContent
    const path =
        heardVia.via === 'browser'
            ? power.browser
            : heardVia.via === 'gateway'
              ? (heardVia.gateway?.name ?? null)
              : heardVia.network === null
                ? connections.via[heardVia.via]
                : connections.network[heardVia.network]
    return path === null ? null : `${isCurrent(node) ? power.via : power.lastVia} ${path}`
}

type PowerTone = 'live' | 'warn' | 'dead' | 'default' | 'faint'

/**
 * What powers a node, in a few words: `Plugged in · 95%`, `Battery low · 12%`,
 * `Plugged in · No battery`. Plugged in and a battery level can both be shown.
 *
 * Plugged in, charging and low are about now, so an offline node gets none of
 * them: only the battery level it last reported and how long ago, `100% · 3 h ago`.
 */
export function powerText(
    node: Pick<Node, 'power' | 'status'>,
    now: number
): {
    readonly text: string
    readonly tone: PowerTone
} {
    const { power } = node
    if (power === null) return { text: '—', tone: 'faint' }
    const words = nodesContent.power
    if (!isCurrent(node)) {
        const level =
            power.battery === 'none'
                ? words.none
                : power.batteryPct === null
                  ? null
                  : `${String(power.batteryPct)}%`
        const ago = sinceMinutes(minutesSince(power.at, now))
        return { text: level === null ? '—' : `${level} · ${ago}`, tone: 'faint' }
    }
    const parts = [
        power.pluggedIn ? words.plugged : power.charging ? words.charging : null,
        power.battery === 'none' ? words.none : power.battery === 'low' ? words.low : null,
        power.batteryPct === null ? null : `${String(power.batteryPct)}%`,
    ].filter((part) => part !== null)
    const tone: PowerTone =
        power.battery === 'low'
            ? 'dead'
            : power.pluggedIn || power.charging
              ? 'live'
              : power.battery === 'none' || (power.batteryPct !== null && power.batteryPct < 50)
                ? 'warn'
                : 'default'
    return { text: parts.length === 0 ? '—' : parts.join(' · '), tone }
}

const minutes = (value: number): string => duration(value * 60_000)

/**
 * When the node is expected, in a line: `Every 30 min, as set on the node ·
 * late after 1 h 15 min · cellular delay 2 min`. Null from an older backend.
 */
export function expectedText(
    expected: Node['expected'],
    words: Readonly<
        Record<'every' | 'configured' | 'observed' | 'default' | 'delay' | 'lateAfter', string>
    >
): string | null {
    return expected === undefined
        ? null
        : [
              `${words.every} ${minutes(expected.intervalMin)}, ${words[expected.source]}`,
              `${words.lateAfter} ${minutes(expected.lateMin)}`,
              expected.delayMin >= 1 ? `${words.delay} ${minutes(expected.delayMin)}` : null,
          ]
              .filter((part) => part !== null)
              .join(' · ')
}

/** The map focused on these nodes; only those with a position can be shown there. */
export function mapLink(nodes: readonly Pick<Node, 'id' | 'position'>[]): string | null {
    const placed = nodes.filter((node) => node.position !== null)
    return placed.length === 0
        ? null
        : `/map?nodes=${placed.map((node) => encodeURIComponent(node.id)).join(',')}`
}

type NodeUse = 'field' | 'computer' | 'recent' | 'quiet' | 'unused'

/**
 * What the network knows of a node. Heard through a gateway, it is out there;
 * last heard through a browser, it is on a computer, not in the field. Someone
 * not on the node is not told about the browser, so they get `recent`.
 */
export function nodeUse(
    node: Pick<Node, 'enabled' | 'lastHeardAt' | 'status' | 'heardVia'>
): NodeUse {
    if (!node.enabled || node.lastHeardAt === null) return 'unused'
    if (node.status === 'offline') return 'quiet'
    if (node.heardVia === null) return 'recent'
    return node.heardVia.via === 'browser' ? 'computer' : 'field'
}

/** Quietest first when ascending, so the nodes that need a visit come to the top. */
const STATUS_RANK: Record<NodeStatus, number> = { offline: 0, late: 1, online: 2 }

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
            // Plugged in ranks above any battery level, while the node is heard.
            return node.power?.pluggedIn === true && isCurrent(node)
                ? 101
                : (node.power?.batteryPct ?? null)
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

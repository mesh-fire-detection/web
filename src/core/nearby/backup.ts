import type { ApiResult } from '@core/api/client'
import type { NodeEventKind, NodeUpload, UploadResult } from '@core/api/nodes'
import { meshId } from '@core/nearby/model'
import type { History, NearbyNode } from '@core/nearby/model'
import type { Observation } from '@core/nearby/storage/observations'

/*
 * Copies what `/connect` saved to the server, for nodes on the person's account.
 * The browser keeps its copy. `/connect` itself sends nothing: this runs from
 * pages that already need a session, and the server stores a repeat only once.
 */
const STORAGE_KEY = 'mfd:node-backup:v1'
/** The API's limits for one upload. */
const MAX_READINGS = 2000
const MAX_EVENTS = 500
/** A long history finishes over several visits, well inside the API's rate limit. */
const MAX_REQUESTS = 20
const MAX_SHORT_NAME = 16

/** Everything else in the activity log is one line per packet, already sent as readings. */
const EVENT_KINDS: Readonly<Record<string, NodeEventKind>> = {
    Connected: 'connected',
    Disconnected: 'disconnected',
    'Node restarted': 'restarted',
    'Malformed packet ignored': 'malformed',
}

/** How far one node's copy has got. */
type Cursor = {
    readonly metrics: Readonly<Record<string, number>>
    readonly eventsAt: number
    readonly connectionAt: number
    /** When everything saved had reached the server. */
    readonly at: number | null
}

const START: Cursor = { metrics: {}, eventsAt: 0, connectionAt: 0, at: null }

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>

function readCursors(storage: Storage): Readonly<Record<string, Cursor>> {
    try {
        const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')
        return typeof value === 'object' && value !== null ? (value as Record<string, Cursor>) : {}
    } catch {
        return {}
    }
}

function writeCursor(storage: Storage, nodeNum: number, cursor: Cursor): void {
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify({ ...readCursors(storage), [nodeNum]: cursor }))
    } catch {
        // Blocked storage only means the next visit sends it again, and the server skips it.
    }
}

/** When this browser last finished copying a node, or null. */
export function lastBackedUp(storage: Storage, nodeNum: number): number | null {
    return readCursors(storage)[nodeNum]?.at ?? null
}

type Saved = {
    readonly history: History
    readonly activity: Observation['activity']
    readonly connection: NonNullable<NodeUpload['connection']> | null
    readonly connectionAt: number
}

type Batch = {
    readonly body: NodeUpload
    readonly cursor: Cursor
}

/** The next upload, or null when nothing is left. */
export function nextBatch(saved: Saved, cursor: Cursor): Batch | null {
    const readings = Object.entries(saved.history)
        .flatMap(([metric, samples]) =>
            samples
                .filter((sample) => sample.at > (cursor.metrics[metric] ?? 0))
                .map((sample) => ({ metric, value: sample.value, at: sample.at }))
        )
        .toSorted((left, right) => left.at - right.at)
        .slice(0, MAX_READINGS)
    const events = saved.activity
        .flatMap(({ at, message }) => {
            const kind = EVENT_KINDS[message]
            return kind === undefined || at <= cursor.eventsAt ? [] : [{ kind, at }]
        })
        .toSorted((left, right) => left.at - right.at)
        .slice(0, MAX_EVENTS)
    const connection =
        saved.connectionAt > cursor.connectionAt && saved.connection !== null
            ? saved.connection
            : null
    if (connection === null && readings.length === 0 && events.length === 0) return null

    const metrics: Record<string, number> = { ...cursor.metrics }
    for (const { metric, at } of readings) metrics[metric] = at
    return {
        body: {
            readings: readings.map(({ metric, value, at }) => ({
                metric,
                value,
                at: new Date(at).toISOString(),
            })),
            events: events.map(({ kind, at }) => ({ kind, at: new Date(at).toISOString() })),
            ...(connection !== null && { connection }),
        },
        cursor: {
            ...cursor,
            metrics,
            eventsAt: events.at(-1)?.at ?? cursor.eventsAt,
            connectionAt: connection === null ? cursor.connectionAt : saved.connectionAt,
        },
    }
}

type Remembered = Pick<NearbyNode, 'id' | 'nodeNum'> &
    Partial<Pick<NearbyNode, 'shortName' | 'connectedAt'>>

export type BackupDeps = {
    readonly storage: Storage
    readonly remembered: () => readonly Remembered[]
    readonly mine: () => Promise<ApiResult<readonly { id: string; meshId: string }[]>>
    readonly loadHistory: (nodeNum: number) => Promise<History>
    readonly loadObservation: (id: string) => Promise<Observation | null>
    readonly upload: (id: string, body: NodeUpload) => Promise<ApiResult<UploadResult>>
    readonly now: () => number
}

/** One node can be saved by Bluetooth and by USB: its history is shared, its activity is not. */
async function savedFor(entries: readonly Remembered[], deps: BackupDeps, nodeNum: number) {
    const history = await deps.loadHistory(nodeNum)
    const observed = await Promise.all(
        entries.map(async (entry) => ({
            entry,
            observation: await deps.loadObservation(entry.id),
        }))
    )
    const newest = observed.toSorted(
        (left, right) => (right.entry.connectedAt ?? 0) - (left.entry.connectedAt ?? 0)
    )[0]
    const connectionAt = newest?.entry.connectedAt ?? 0
    const settings = newest?.observation?.configuration ?? {}
    const shortName = newest?.entry.shortName?.trim().slice(0, MAX_SHORT_NAME) ?? ''
    const reported = shortName !== '' || Object.keys(settings).length > 0
    return {
        history,
        activity: observed.flatMap(({ observation }) => observation?.activity ?? []),
        connection:
            reported && connectionAt > 0
                ? {
                      shortName: shortName === '' ? null : shortName,
                      settings,
                      at: new Date(connectionAt).toISOString(),
                  }
                : null,
        connectionAt,
    } satisfies Saved
}

/** Sends one node's batches until done, out of requests, or refused. */
async function backUpNode(
    node: { readonly id: string },
    nodeNum: number,
    saved: Saved,
    deps: BackupDeps,
    budget: { requests: number }
): Promise<number> {
    let cursor = readCursors(deps.storage)[nodeNum] ?? START
    let stored = 0
    let batch = nextBatch(saved, cursor)
    while (batch !== null) {
        if (budget.requests === 0) return stored
        budget.requests -= 1
        const result = await deps.upload(node.id, batch.body)
        if (!result.ok) return stored
        stored += result.data.readings + result.data.events
        ;({ cursor } = batch)
        writeCursor(deps.storage, nodeNum, cursor)
        batch = nextBatch(saved, cursor)
    }
    writeCursor(deps.storage, nodeNum, { ...cursor, at: deps.now() })
    return stored
}

/** Copies every saved node on the account, and returns how many new records arrived. */
export async function backUpNodes(deps: BackupDeps): Promise<number> {
    const remembered = deps.remembered()
    if (remembered.length === 0) return 0
    const mine = await deps.mine()
    if (!mine.ok) return 0

    const budget = { requests: MAX_REQUESTS }
    let stored = 0
    for (const node of mine.data) {
        const entries = remembered.filter(
            ({ nodeNum }) => nodeNum !== null && meshId(nodeNum) === node.meshId
        )
        const nodeNum = entries[0]?.nodeNum
        if (nodeNum === null || nodeNum === undefined) continue
        const saved = await savedFor(entries, deps, nodeNum)
        stored += await backUpNode(node, nodeNum, saved, deps, budget)
    }
    return stored
}

import { HISTORY_RETENTION_MS } from '@core/nearby/model'
import type { History, Sample } from '@core/nearby/model'
import { observation, parseObservation } from '@core/nearby/storage/observations'
import type { Observation } from '@core/nearby/storage/observations'

/*
 * Reading history kept in IndexedDB, one record per sample, shaped like the
 * backend's `readings` table (device, metric, recorded_at, value) so the two can
 * be merged or synced later. Records are keyed by node number, not by Bluetooth
 * or USB connection, so a node reached both ways shares one history.
 */
const DATABASE = 'mesh-fire-detection'
const VERSION = 2
const READINGS = 'readings'
const OBSERVATIONS = 'observations'
const BY_TIME = 'recordedAt'

type ReadingRecord = {
    readonly nodeNum: number
    readonly metric: string
    /** Measurement time in epoch milliseconds, or receipt time without one. */
    readonly recordedAt: number
    readonly value: number
}

/** What one history update writes: samples to store and sample times to drop. */
export type HistoryChanges = {
    readonly put: readonly Sample[]
    readonly remove: readonly number[]
}

/**
 * `addSample` only touches the tail: it appends, or replaces the newest sample
 * when the one before it is under five minutes old. Pruning by age happens in the
 * store itself, so only those two cases need writing.
 */
export function historyChanges(
    previous: readonly Sample[] | undefined,
    next: readonly Sample[]
): HistoryChanges {
    const newest = next.at(-1)
    const old = previous?.at(-1)
    if (!newest || newest === old) return { put: [], remove: [] }
    const replaced = old !== undefined && next.at(-2) !== old
    return { put: [newest], remove: replaced ? [old.at] : [] }
}

function request<T>(operation: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        operation.addEventListener('success', () => {
            resolve(operation.result)
        })
        operation.addEventListener('error', () => {
            reject(operation.error ?? new Error('IndexedDB request failed'))
        })
    })
}

function completed(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.addEventListener('complete', () => {
            resolve()
        })
        transaction.addEventListener('error', () => {
            reject(transaction.error ?? new Error('IndexedDB transaction failed'))
        })
        transaction.addEventListener('abort', () => {
            reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
        })
    })
}

async function open(factory: IDBFactory): Promise<IDBDatabase> {
    const opening = factory.open(DATABASE, VERSION)
    let abandoned = false
    let timeout: ReturnType<typeof setTimeout> | undefined
    const unavailable = new Promise<never>((_resolve, reject) => {
        const fail = () => {
            abandoned = true
            reject(new Error('IndexedDB could not open'))
        }
        opening.addEventListener('blocked', fail)
        timeout = setTimeout(fail, 5000)
    })
    opening.addEventListener('upgradeneeded', () => {
        const db = opening.result
        if (!db.objectStoreNames.contains(READINGS)) {
            const store = db.createObjectStore(READINGS, {
                keyPath: ['nodeNum', 'metric', 'recordedAt'],
            })
            store.createIndex(BY_TIME, 'recordedAt')
        }
        if (!db.objectStoreNames.contains(OBSERVATIONS))
            db.createObjectStore(OBSERVATIONS, { keyPath: 'id' })
    })
    opening.addEventListener('success', () => {
        if (abandoned) opening.result.close()
        opening.result.addEventListener('versionchange', () => {
            opening.result.close()
        })
    })
    try {
        return await Promise.race([request(opening), unavailable])
    } finally {
        clearTimeout(timeout)
    }
}

/** Every key of one node: array keys sort by their first element first. */
function nodeRange(nodeNum: number): IDBKeyRange {
    return IDBKeyRange.bound([nodeNum], [nodeNum + 1], false, true)
}

export function createReadingStore(factory: () => IDBFactory | undefined) {
    let database: Promise<IDBDatabase> | undefined
    const prune = async (db: IDBDatabase) => {
        const transaction = db.transaction(READINGS, 'readwrite')
        const stale = IDBKeyRange.upperBound(Date.now() - HISTORY_RETENTION_MS, true)
        const cursor = transaction.objectStore(READINGS).index(BY_TIME).openKeyCursor(stale)
        cursor.addEventListener('success', () => {
            const current = cursor.result
            if (!current) return
            transaction.objectStore(READINGS).delete(current.primaryKey)
            current.continue()
        })
        await completed(transaction)
    }
    const connect = async () => {
        const available = factory()
        if (!available) throw new Error('IndexedDB is unavailable')
        database ??= (async () => {
            const db = await open(available)
            await prune(db)
            return db
        })()
        return database
    }
    return {
        async loadObservation(id: string): Promise<Observation | null> {
            try {
                const db = await connect()
                return parseObservation(
                    await request(db.transaction(OBSERVATIONS).objectStore(OBSERVATIONS).get(id))
                )
            } catch {
                return null
            }
        },
        async saveObservation(device: Observation): Promise<void> {
            try {
                const db = await connect()
                const transaction = db.transaction(OBSERVATIONS, 'readwrite')
                transaction.objectStore(OBSERVATIONS).put(observation(device))
                await completed(transaction)
            } catch {
                // Blocked storage must not prevent a manual connection.
            }
        },
        async removeObservation(id: string): Promise<void> {
            try {
                const db = await connect()
                const transaction = db.transaction(OBSERVATIONS, 'readwrite')
                transaction.objectStore(OBSERVATIONS).delete(id)
                await completed(transaction)
            } catch {
                // The saved device list still prevents restoration of removed entries.
            }
        },
        /** A node's history by metric, oldest first; empty when storage is blocked. */
        async load(nodeNum: number): Promise<History> {
            try {
                const db = await connect()
                const records = (await request(
                    db.transaction(READINGS).objectStore(READINGS).getAll(nodeRange(nodeNum))
                )) as ReadingRecord[]
                const history: Record<string, Sample[]> = {}
                for (const record of records) {
                    const samples = (history[record.metric] ??= [])
                    samples.push({ value: record.value, at: record.recordedAt })
                }
                return history
            } catch {
                return {}
            }
        },
        /** Writes one metric's changes; a failed write leaves the page session usable. */
        async apply(nodeNum: number, metric: string, changes: HistoryChanges): Promise<void> {
            if (changes.put.length === 0 && changes.remove.length === 0) return
            try {
                const db = await connect()
                const transaction = db.transaction(READINGS, 'readwrite')
                const store = transaction.objectStore(READINGS)
                for (const at of changes.remove) store.delete([nodeNum, metric, at])
                for (const sample of changes.put) {
                    const record: ReadingRecord = {
                        nodeNum,
                        metric,
                        recordedAt: sample.at,
                        value: sample.value,
                    }
                    store.put(record)
                }
                await completed(transaction)
            } catch {
                // Private windows and blocked site data reject IndexedDB.
            }
        },
    }
}

export type ReadingStore = ReturnType<typeof createReadingStore>

/** Unions two histories per metric, ordered by time, newer value winning a tie. */
export function mergeHistory(stored: History, current: History): History {
    const merged: Record<string, readonly Sample[]> = { ...stored }
    for (const [metric, samples] of Object.entries(current)) {
        // A stable sort keeps the current sample after a stored one at the same time.
        const ordered = [...(stored[metric] ?? []), ...samples].toSorted(
            (left, right) => left.at - right.at
        )
        merged[metric] = ordered.filter((sample, index) => ordered[index + 1]?.at !== sample.at)
    }
    return merged
}

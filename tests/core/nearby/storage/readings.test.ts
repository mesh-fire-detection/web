import { IDBFactory } from 'fake-indexeddb'
// Installs IDBKeyRange and the other IndexedDB globals the store uses.
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'

import { HISTORY_RETENTION_MS } from '@core/nearby/model'
import { createReadingStore, historyChanges, mergeHistory } from '@core/nearby/storage/readings'

const NODE = 0xda_5a_8b_79
const TEMPERATURE = 'environmentMetrics.temperature'

describe('history changes written per update', () => {
    const first = { value: 20, at: 1000 }
    const second = { value: 21, at: 2000 }
    const third = { value: 22, at: 3000 }

    it('puts an appended sample', () => {
        expect(historyChanges([first], [first, second])).toEqual({ put: [second], remove: [] })
    })

    it('replaces the newest sample when it was swapped out', () => {
        expect(historyChanges([first, second], [first, third])).toEqual({
            put: [third],
            remove: [2000],
        })
    })

    it('writes nothing when the newest sample is unchanged', () => {
        expect(historyChanges([first, second], [second])).toEqual({ put: [], remove: [] })
    })
})

describe('merging stored and current history', () => {
    it('unions by time, keeping the current value at the same time', () => {
        const merged = mergeHistory(
            {
                [TEMPERATURE]: [
                    { value: 18, at: 1 },
                    { value: 19, at: 2 },
                ],
            },
            {
                [TEMPERATURE]: [
                    { value: 20, at: 2 },
                    { value: 21, at: 3 },
                ],
            }
        )
        expect(merged[TEMPERATURE]).toEqual([
            { value: 18, at: 1 },
            { value: 20, at: 2 },
            { value: 21, at: 3 },
        ])
    })
})

describe('IndexedDB reading store', () => {
    it('keeps one history per node across stores and drops the replaced sample', async () => {
        const factory = new IDBFactory()
        const now = Date.now()
        const store = createReadingStore(() => factory)
        await store.apply(NODE, TEMPERATURE, { put: [{ value: 20, at: now - 1000 }], remove: [] })
        await store.apply(NODE, TEMPERATURE, {
            put: [{ value: 21, at: now }],
            remove: [now - 1000],
        })
        await store.apply(1234, TEMPERATURE, { put: [{ value: 5, at: now }], remove: [] })
        const reopened = createReadingStore(() => factory)
        expect(await reopened.load(NODE)).toEqual({ [TEMPERATURE]: [{ value: 21, at: now }] })
        expect(await reopened.load(9999)).toEqual({})
    })

    it('drops samples older than the retention when the database opens', async () => {
        const factory = new IDBFactory()
        const now = Date.now()
        await createReadingStore(() => factory).apply(NODE, TEMPERATURE, {
            put: [
                { value: 1, at: now - HISTORY_RETENTION_MS - 60_000 },
                { value: 2, at: now - 60_000 },
            ],
            remove: [],
        })
        const reopened = createReadingStore(() => factory)
        expect(await reopened.load(NODE)).toEqual({
            [TEMPERATURE]: [{ value: 2, at: now - 60_000 }],
        })
    })

    it('reads as empty and writes nothing when IndexedDB is unavailable', async () => {
        const store = createReadingStore(() => {})
        await expect(
            store.apply(NODE, TEMPERATURE, { put: [{ value: 1, at: 1 }], remove: [] })
        ).resolves.toBeUndefined()
        expect(await store.load(NODE)).toEqual({})
    })
})

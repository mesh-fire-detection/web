import { describe, expect, it, vi } from 'vitest'

import type { NodeUpload } from '@core/api/nodes'
import { backUpNodes, lastBackedUp, nextBatch } from '@core/nearby/backup'
import type { BackupDeps } from '@core/nearby/backup'
import { meshId } from '@core/nearby/model'
import type { Observation } from '@core/nearby/storage/observations'

const NODE = 0x7d_25_8b_79
const TEMPERATURE = 'environmentMetrics.temperature'
const SECOND = 1000
const START = { metrics: {}, eventsAt: 0, connectionAt: 0, at: null }

function memoryStorage() {
    const values = new Map<string, string>()
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
            values.set(key, value)
        },
    }
}

const observation = (overrides: Partial<Observation> = {}): Observation => ({
    id: 'usb:1',
    nodeNum: NODE,
    lastPacketAt: null,
    configuration: {},
    peers: {},
    activity: [],
    ...overrides,
})

function deps(overrides: Partial<BackupDeps> = {}) {
    const uploads: NodeUpload[] = []
    const upload = vi.fn((_id: string, body: NodeUpload) => {
        uploads.push(body)
        return Promise.resolve({
            ok: true as const,
            data: {
                readings: body.readings?.length ?? 0,
                events: body.events?.length ?? 0,
                skipped: 0,
            },
        })
    })
    const base: BackupDeps = {
        storage: memoryStorage(),
        remembered: () => [{ id: 'usb:1', nodeNum: NODE, connectedAt: 500 * SECOND }],
        mine: () => Promise.resolve({ ok: true, data: [{ id: 'n-0002', meshId: meshId(NODE) }] }),
        loadHistory: () => Promise.resolve({ [TEMPERATURE]: [{ value: 20, at: 100 * SECOND }] }),
        loadObservation: () => Promise.resolve(observation()),
        upload,
        now: () => 900 * SECOND,
        ...overrides,
    }
    return { base, upload, uploads }
}

const saved = (overrides: Partial<Parameters<typeof nextBatch>[0]> = {}) => ({
    history: {},
    activity: [],
    connection: null,
    connectionAt: 0,
    ...overrides,
})

describe('nextBatch', () => {
    it('sends every sample, timed by the sensor or on receipt', () => {
        const batch = nextBatch(
            saved({
                history: {
                    [TEMPERATURE]: [
                        { value: 1, at: 100 * SECOND },
                        { value: 2, at: 100 * SECOND + 123 },
                    ],
                },
            }),
            START
        )

        expect(batch?.body.readings).toEqual([
            { metric: TEMPERATURE, value: 1, at: new Date(100 * SECOND).toISOString() },
            { metric: TEMPERATURE, value: 2, at: new Date(100 * SECOND + 123).toISOString() },
        ])
    })

    it('keeps node events and leaves packet lines out', () => {
        const batch = nextBatch(
            saved({
                activity: [
                    { at: 1, message: 'Connecting' },
                    { at: 2, message: 'Connected' },
                    { at: 3, message: 'Particle telemetry received · sender !7d258b79' },
                    { at: 4, message: 'Node restarted' },
                    { at: 5, message: 'Malformed packet ignored' },
                    { at: 6, message: 'Disconnected' },
                ],
            }),
            START
        )

        expect(batch?.body.events?.map((event) => event.kind)).toEqual([
            'connected',
            'restarted',
            'malformed',
            'disconnected',
        ])
    })

    it('tracks each metric on its own, so a late sample of one is not lost', () => {
        const batch = nextBatch(
            saved({
                history: {
                    a: [{ value: 1, at: 200 * SECOND }],
                    b: [{ value: 2, at: 100 * SECOND }],
                },
            }),
            { ...START, metrics: { a: 200 * SECOND, b: 50 * SECOND } }
        )

        expect(batch?.body.readings?.map((reading) => reading.metric)).toEqual(['b'])
    })

    it('splits a long history, oldest first', () => {
        const samples = Array.from({ length: 2500 }, (_, index) => ({
            value: index,
            at: (index + 1) * SECOND,
        }))

        const batch = nextBatch(saved({ history: { [TEMPERATURE]: samples } }), START)

        expect(batch?.body.readings).toHaveLength(2000)
        expect(batch?.cursor.metrics[TEMPERATURE]).toBe(2000 * SECOND)
    })

    it('has nothing to send once everything has gone', () => {
        expect(nextBatch(saved(), START)).toBeNull()
    })
})

describe('backUpNodes', () => {
    it('uploads saved data, then nothing more on the next visit', async () => {
        const { base, upload } = deps()

        expect(await backUpNodes(base)).toBe(1)
        expect(await backUpNodes(base)).toBe(0)

        expect(upload).toHaveBeenCalledTimes(1)
        expect(upload.mock.calls[0]?.[0]).toBe('n-0002')
        expect(lastBackedUp(base.storage, NODE)).toBe(900 * SECOND)
    })

    it('leaves out a node that is not on the account', async () => {
        const { base, upload } = deps({
            mine: () => Promise.resolve({ ok: true, data: [] }),
        })

        await backUpNodes(base)

        expect(upload).not.toHaveBeenCalled()
        expect(lastBackedUp(base.storage, NODE)).toBeNull()
    })

    it('does not ask the server anything when nothing is saved', async () => {
        const mine = vi.fn(() => Promise.resolve({ ok: true as const, data: [] }))
        const { base } = deps({ remembered: () => [], mine })

        await backUpNodes(base)

        expect(mine).not.toHaveBeenCalled()
    })

    it('retries what failed on the next visit', async () => {
        const { base, upload } = deps()
        upload.mockResolvedValueOnce({
            ok: false,
            error: 'unreachable',
        } as never)

        expect(await backUpNodes(base)).toBe(0)
        expect(lastBackedUp(base.storage, NODE)).toBeNull()

        expect(await backUpNodes(base)).toBe(1)
    })

    it('sends the newest connection’s settings, and activity from every connection', async () => {
        const { base, uploads } = deps({
            remembered: () => [
                { id: 'ble:1', nodeNum: NODE, connectedAt: 100 * SECOND, shortName: 'OLD' },
                { id: 'usb:1', nodeNum: NODE, connectedAt: 500 * SECOND, shortName: 'NEW' },
            ],
            loadObservation: (id) =>
                Promise.resolve(
                    observation({
                        id,
                        configuration: { 'Meshtastic role': id === 'usb:1' ? 'Router' : 'Client' },
                        activity: [{ at: id === 'usb:1' ? 2 : 1, message: 'Connected' }],
                    })
                ),
        })

        await backUpNodes(base)

        expect(uploads[0]?.connection).toEqual({
            shortName: 'NEW',
            settings: { 'Meshtastic role': 'Router' },
            at: new Date(500 * SECOND).toISOString(),
        })
        expect(uploads[0]?.events).toHaveLength(2)
    })

    it('stops after 20 requests and carries on next visit', async () => {
        const samples = Array.from({ length: 41_000 }, (_, index) => ({
            value: index,
            at: (index + 1) * SECOND,
        }))
        const { base, upload } = deps({
            loadHistory: () => Promise.resolve({ [TEMPERATURE]: samples }),
        })

        await backUpNodes(base)
        expect(upload).toHaveBeenCalledTimes(20)
        expect(lastBackedUp(base.storage, NODE)).toBeNull()

        await backUpNodes(base)
        expect(upload).toHaveBeenCalledTimes(21)
        expect(lastBackedUp(base.storage, NODE)).toBe(900 * SECOND)
    })
})

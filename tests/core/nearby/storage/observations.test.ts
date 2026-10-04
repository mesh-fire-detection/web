import { create } from '@bufbuild/protobuf'
import { Config, Mesh, Telemetry } from '@meshtastic/protobufs'
import { IDBFactory } from 'fake-indexeddb'
import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'

import { emptyDevice } from '@core/nearby/model'
import { createNearbySession } from '@core/nearby/session'
import { createDeviceMemory } from '@core/nearby/storage/devices'
import { parseObservation } from '@core/nearby/storage/observations'
import { createReadingStore } from '@core/nearby/storage/readings'

import { linkPacket, mockRadio, radioMessage, telemetryPacket } from '../../../support/nearby'

describe('saved observations', () => {
    it('restores every details section across reloads without claiming a live connection', async () => {
        const factory = new IDBFactory()
        const store = createReadingStore(() => factory)
        let saved: string | null = null
        const memory = createDeviceMemory(() => ({
            getItem: () => saved,
            setItem: (_key, value) => {
                saved = value
            },
        }))
        const radio = mockRadio(123)
        const original = createNearbySession(() => Promise.resolve(radio.connection), {
            memory,
            readings: store,
        })
        await original.restore()
        await original.add()
        radio.send(
            radioMessage({
                case: 'config',
                value: create(Config.ConfigSchema, {
                    payloadVariant: { case: 'lora', value: { txEnabled: true } },
                }),
            })
        )
        radio.send(
            radioMessage({
                case: 'nodeInfo',
                value: create(Mesh.NodeInfoSchema, {
                    num: 456,
                    user: {
                        longName: 'Neighbour',
                        shortName: 'NE',
                        hwModel: Mesh.HardwareModel.RAK4631,
                    },
                }),
            })
        )
        radio.send(linkPacket(456, { snr: 6.5, rssi: -90, hops: 0 }))
        radio.send(
            telemetryPacket(456, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 19 }),
            })
        )
        radio.send(
            telemetryPacket(123, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: -5 }),
            })
        )
        const expected = original.getSnapshot().devices[0]
        expect(expected).toBeDefined()
        await vi.waitFor(async () => {
            const stored = await store.loadObservation(radio.connection.id)
            expect(stored?.activity).toEqual(expected?.activity)
        })
        original.dispose()
        for (let reload = 0; reload < 2; reload += 1) {
            const restored = createNearbySession(() => Promise.resolve(null), {
                memory,
                readings: createReadingStore(() => factory),
            })
            await restored.restore()
            await vi.waitFor(() => {
                expect(restored.getSnapshot().devices[0]).toEqual({
                    ...expected,
                    state: 'disconnected',
                })
            })
            restored.dispose()
        }
        const reconnected = createNearbySession(() => Promise.resolve(null), {
            memory,
            readings: createReadingStore(() => factory),
            known: () => Promise.resolve([radio.connection]),
        })
        await reconnected.restore()
        expect(reconnected.getSnapshot().devices[0]).toMatchObject({
            state: 'connected',
            configuration: expected?.configuration,
            peers: expected?.peers,
            lastPacketAt: expected?.lastPacketAt,
            readings: expected?.readings,
        })
        reconnected.remove(radio.connection.id)
        await vi.waitFor(async () => {
            expect(await store.loadObservation(radio.connection.id)).toBeNull()
        })
        reconnected.undoRemove()
        await vi.waitFor(async () => {
            expect(await store.loadObservation(radio.connection.id)).not.toBeNull()
        })
        reconnected.dispose()
    })

    it('upgrades the existing history database without losing readings', async () => {
        const factory = new IDBFactory()
        const now = Date.now()
        await new Promise<void>((resolve, reject) => {
            const opening = factory.open('mesh-fire-detection', 1)
            opening.addEventListener('upgradeneeded', () => {
                const readings = opening.result.createObjectStore('readings', {
                    keyPath: ['nodeNum', 'metric', 'recordedAt'],
                })
                readings.createIndex('recordedAt', 'recordedAt')
                readings.put({ nodeNum: 123, metric: 'temperature', recordedAt: now, value: -5 })
            })
            opening.addEventListener('success', () => {
                opening.result.close()
                resolve()
            })
            opening.addEventListener('error', () => {
                reject(opening.error ?? new Error('Database failed to open'))
            })
        })
        const store = createReadingStore(() => factory)
        await store.saveObservation(emptyDevice('radio', ''))
        expect(await store.load(123)).toEqual({ temperature: [{ at: now, value: -5 }] })
        expect(await store.loadObservation('radio')).not.toBeNull()
    })

    it('rejects corrupt observations and excludes secret or unknown fields', async () => {
        expect(parseObservation({ id: 'radio', peers: { bad: {} } })).toBeNull()
        const store = createReadingStore(() => new IDBFactory())
        await store.saveObservation({
            ...emptyDevice('radio', ''),
            configuration: { 'LoRa region': 'US', secret: 'private-key' },
        })
        const saved = await store.loadObservation('radio')
        expect(saved?.configuration).toEqual({ 'LoRa region': 'US' })
        expect(saved).not.toHaveProperty('state')
        expect(saved).not.toHaveProperty('history')
    })

    it('keeps storage failures harmless', async () => {
        const store = createReadingStore(() => {})
        await store.saveObservation(emptyDevice('radio', ''))
        expect(await store.loadObservation('radio')).toBeNull()
        await expect(store.removeObservation('radio')).resolves.toBeUndefined()
    })

    it('does not block restoration when an older tab holds the database open', async () => {
        const factory = new IDBFactory()
        const existing = await new Promise<IDBDatabase>((resolve) => {
            const opening = factory.open('mesh-fire-detection', 1)
            opening.addEventListener('success', () => {
                resolve(opening.result)
            })
        })
        const store = createReadingStore(() => factory)
        let saved: string | null = null
        const memory = createDeviceMemory(() => ({
            getItem: () => saved,
            setItem: (_key, value) => {
                saved = value
            },
        }))
        memory.write([emptyDevice('radio', '')], null)
        const session = createNearbySession(() => Promise.resolve(null), {
            memory,
            readings: store,
        })
        try {
            await session.restore()
            expect(session.getSnapshot().busy).toBe(false)
            expect(session.getSnapshot().devices).toHaveLength(1)
        } finally {
            session.dispose()
            existing.close()
        }
    })
})

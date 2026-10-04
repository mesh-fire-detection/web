import { create, fromBinary } from '@bufbuild/protobuf'
import { Mesh, Telemetry } from '@meshtastic/protobufs'
import { IDBFactory } from 'fake-indexeddb'
// Installs IDBKeyRange and the other IndexedDB globals the store uses.
import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { emptyDevice, isRecentDevice, RECENT_CONNECTION_MS } from '@core/nearby/model'
import { createNearbySession } from '@core/nearby/session'
import { createDeviceMemory } from '@core/nearby/storage/devices'
import { createReadingStore } from '@core/nearby/storage/readings'

import { mockRadio, radioMessage, telemetryPacket } from '../../support/nearby'

afterEach(() => {
    vi.useRealTimers()
})

describe('nearby sessions', () => {
    function deviceMemory() {
        let value: string | null = null
        return createDeviceMemory(() => ({
            getItem: () => value,
            setItem: (_key, next) => {
                value = next
            },
        }))
    }

    it('shows a connecting state while the codec loads and never opens a canceled connection', async () => {
        const codec = await import('@core/nearby/protocol')
        const pending = Promise.withResolvers<typeof codec>()
        const radio = mockRadio(123)
        const session = createNearbySession(() => Promise.resolve(radio.connection), {
            loadProtocol: () => pending.promise,
        })
        const adding = session.add()
        await Promise.resolve()
        expect(session.getSnapshot()).toMatchObject({ busy: true })
        expect(session.getSnapshot().devices[0]?.state).toBe('connecting')
        expect(radio.connection.connect).not.toHaveBeenCalled()
        void session.disconnect(radio.connection.id)
        await adding
        pending.resolve(codec)
        await Promise.resolve()
        expect(radio.connection.connect).not.toHaveBeenCalled()
        expect(session.getSnapshot().devices[0]?.state).toBe('disconnected')
        session.dispose()
    })

    it('retries a failed codec download without leaking the error or reopening the chooser', async () => {
        const codec = await import('@core/nearby/protocol')
        const loadProtocol = vi
            .fn<() => Promise<typeof codec>>()
            .mockRejectedValueOnce(new Error('private network error'))
            .mockResolvedValue(codec)
        const radio = mockRadio(123)
        const choose = vi.fn(() => Promise.resolve(radio.connection))
        const session = createNearbySession(choose, { loadProtocol })
        await session.add()
        expect(session.getSnapshot().error).toBe('connection')
        expect(JSON.stringify(session.getSnapshot())).not.toContain('private network error')
        await session.connect(radio.connection.id)
        expect(session.getSnapshot().devices[0]?.state).toBe('connected')
        expect(loadProtocol).toHaveBeenCalledTimes(2)
        expect(choose).toHaveBeenCalledOnce()
        session.dispose()
    })

    it('restores only saved devices and reconnects the last active one with fresh observations', async () => {
        const first = mockRadio(123)
        const second = mockRadio(456)
        const unrelated = mockRadio(789)
        const memory = deviceMemory()
        const choose = vi.fn(() => Promise.resolve(first.connection))
        const original = createNearbySession(choose, { memory })
        await original.restore()
        await original.add()
        first.send(
            telemetryPacket(123, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 24 }),
            })
        )
        memory.write(
            [
                ...original.getSnapshot().devices,
                emptyDevice(second.connection.id, second.connection.name),
            ],
            first.connection.id
        )
        original.dispose()
        const restored = createNearbySession(choose, {
            memory,
            known: () =>
                Promise.resolve([first.connection, second.connection, unrelated.connection]),
        })
        await restored.restore()
        expect(restored.getSnapshot().devices).toHaveLength(2)
        expect(restored.getSnapshot().devices[0]).toMatchObject({
            state: 'connected',
            readings: {},
            peers: {},
        })
        expect(restored.getSnapshot().devices[1]?.state).toBe('disconnected')
        expect(second.connection.connect).not.toHaveBeenCalled()
        expect(unrelated.connection.connect).not.toHaveBeenCalled()
        expect(choose).toHaveBeenCalledOnce()
        restored.dispose()
    })

    it('restores identity and the last packet time from saved readings', async () => {
        const memory = deviceMemory()
        const reading = (metric: string, receivedAt: number) => ({
            metric,
            value: 1,
            sender: 123,
            receivedAt,
            measuredAt: null,
            cached: false,
        })
        memory.write(
            [
                {
                    ...emptyDevice('radio', ''),
                    nodeNum: 123,
                    hardware: 'RAK4631',
                    firmware: '2.6.11.mfd',
                    shortName: 'SN',
                    readings: {
                        a: reading('a', 2000),
                        b: reading('b', 5000),
                    },
                },
                emptyDevice('empty', ''),
            ],
            null
        )
        const session = createNearbySession(() => Promise.resolve(null), { memory })
        await session.restore()
        expect(session.getSnapshot().devices[0]).toMatchObject({
            lastPacketAt: 5000,
            hardware: 'RAK4631',
            firmware: '2.6.11.mfd',
            shortName: 'SN',
        })
        expect(session.getSnapshot().devices[1]?.lastPacketAt).toBeNull()
        session.dispose()
    })

    it('stores history in IndexedDB by node and brings it back after a reload', async () => {
        const factory = new IDBFactory()
        const radio = mockRadio(123)
        const memory = deviceMemory()
        const original = createNearbySession(() => Promise.resolve(radio.connection), {
            memory,
            readings: createReadingStore(() => factory),
        })
        await original.restore()
        await original.add()
        radio.send(
            telemetryPacket(123, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 24 }),
            })
        )
        await vi.waitFor(async () => {
            const stored = await createReadingStore(() => factory).load(123)
            expect(stored['environmentMetrics.temperature']).toHaveLength(1)
        })
        original.dispose()
        const restored = createNearbySession(() => Promise.resolve(null), {
            memory,
            readings: createReadingStore(() => factory),
        })
        await restored.restore()
        await vi.waitFor(() => {
            expect(
                restored.getSnapshot().devices[0]?.history['environmentMetrics.temperature']
            ).toEqual([expect.objectContaining({ value: 24 })])
        })
        restored.dispose()
    })

    it('moves history saved in localStorage by older versions into IndexedDB', async () => {
        const factory = new IDBFactory()
        const memory = createDeviceMemory(() => ({
            getItem: () =>
                JSON.stringify({
                    version: 1,
                    devices: [
                        {
                            id: 'radio',
                            bluetoothName: '',
                            name: '',
                            nodeNum: 123,
                            voltageHistory: [{ value: 3.8, at: Date.now() }],
                        },
                    ],
                    activeId: null,
                }),
            setItem: () => {},
        }))
        const session = createNearbySession(() => Promise.resolve(null), {
            memory,
            readings: createReadingStore(() => factory),
        })
        await session.restore()
        await vi.waitFor(async () => {
            const stored = await createReadingStore(() => factory).load(123)
            expect(stored['deviceMetrics.voltage']).toEqual([
                expect.objectContaining({ value: 3.8 }),
            ])
        })
        session.dispose()
    })

    it('keeps an unavailable node saved after an automatic connection timeout', async () => {
        vi.useFakeTimers()
        const radio = mockRadio(123)
        const memory = deviceMemory()
        memory.write([emptyDevice(radio.connection.id, radio.connection.name)], radio.connection.id)
        const connection = {
            ...radio.connection,
            connect: vi.fn<typeof radio.connection.connect>(() => new Promise<void>(() => {})),
        }
        const session = createNearbySession(() => Promise.resolve(null), {
            memory,
            known: () => Promise.resolve([connection]),
        })
        const restoring = session.restore()
        await vi.advanceTimersByTimeAsync(30_000)
        await restoring
        expect(session.getSnapshot()).toMatchObject({ busy: false, error: 'timeout' })
        expect(session.getSnapshot().devices[0]?.state).toBe('disconnected')
        expect(memory.read().activeId).toBe(connection.id)
        expect(connection.disconnect).toHaveBeenCalledOnce()
        session.dispose()
    })

    it('requires fresh identity even when the stored entry already has a node number', async () => {
        vi.useFakeTimers()
        const radio = mockRadio(123)
        const memory = deviceMemory()
        memory.write(
            [{ ...emptyDevice(radio.connection.id, radio.connection.name), nodeNum: 123 }],
            radio.connection.id
        )
        const connection = {
            ...radio.connection,
            connect: vi.fn<typeof radio.connection.connect>((request, receive) => {
                const payload = fromBinary(Mesh.ToRadioSchema, request).payloadVariant
                if (payload.case !== 'wantConfigId')
                    throw new Error('Expected configuration request')
                receive(radioMessage({ case: 'configCompleteId', value: payload.value }))
                return Promise.resolve()
            }),
        }
        const session = createNearbySession(() => Promise.resolve(null), {
            memory,
            known: () => Promise.resolve([connection]),
        })
        const restoring = session.restore()
        await vi.advanceTimersByTimeAsync(30_000)
        await restoring
        expect(session.getSnapshot().error).toBe('timeout')
        expect(session.getSnapshot().devices[0]?.state).toBe('disconnected')
        session.dispose()
    })

    it('falls back to the chooser when permission is missing and forgets removed entries', async () => {
        const radio = mockRadio(123)
        const memory = deviceMemory()
        memory.write([emptyDevice(radio.connection.id, radio.connection.name)], radio.connection.id)
        const choose = vi.fn(() => Promise.resolve(radio.connection))
        const session = createNearbySession(choose, { memory, known: () => Promise.resolve([]) })
        await session.restore()
        expect(radio.connection.connect).not.toHaveBeenCalled()
        await session.connect(radio.connection.id)
        expect(choose).toHaveBeenCalledOnce()
        expect(session.getSnapshot().devices).toHaveLength(1)
        expect(session.getSnapshot().devices[0]?.state).toBe('connected')
        session.remove(radio.connection.id)
        expect(memory.read()).toMatchObject({ devices: [], activeId: null })
        session.dispose()
    })

    it('puts a removed entry back in place when undone, and forgets it after ten seconds', async () => {
        vi.useFakeTimers()
        const memory = deviceMemory()
        memory.write([emptyDevice('first', 'First'), emptyDevice('second', 'Second')], null)
        const session = createNearbySession(() => Promise.resolve(null), { memory })
        await session.restore()
        session.remove('first')
        expect(session.getSnapshot().removed?.id).toBe('first')
        expect(memory.read().devices.map((device) => device.id)).toEqual(['second'])
        session.undoRemove()
        expect(session.getSnapshot()).toMatchObject({ removed: null, selectedId: 'first' })
        expect(memory.read().devices.map((device) => device.id)).toEqual(['first', 'second'])
        session.remove('second')
        vi.advanceTimersByTime(10_000)
        expect(session.getSnapshot().removed).toBeNull()
        session.undoRemove()
        expect(session.getSnapshot().devices.map((device) => device.id)).toEqual(['first'])
        session.dispose()
    })

    it('respects explicit disconnect while remembering unexpected connection loss', async () => {
        const radio = mockRadio(123)
        const memory = deviceMemory()
        const session = createNearbySession(() => Promise.resolve(radio.connection), { memory })
        await session.restore()
        await session.add()
        radio.loseConnection()
        expect(memory.read().activeId).toBe(radio.connection.id)
        expect(session.getSnapshot().devices.filter(isRecentDevice)).toHaveLength(1)
        await session.connect(radio.connection.id)
        await session.disconnect(radio.connection.id)
        expect(memory.read().activeId).toBeNull()
        expect(session.getSnapshot().devices.filter(isRecentDevice)).toHaveLength(0)
        session.dispose()
    })

    it('keeps a recent device selected after reload and expires from connection time without extending on another reload', async () => {
        vi.useFakeTimers()
        const radio = mockRadio(123)
        const memory = deviceMemory()
        const original = createNearbySession(() => Promise.resolve(radio.connection), { memory })
        await original.restore()
        await original.add()
        const connectedAt = Date.now()
        original.dispose()
        await vi.advanceTimersByTimeAsync(4 * 60 * 1000)
        const createRestored = () =>
            createNearbySession(() => Promise.resolve(null), {
                memory,
                known: () => Promise.resolve(null),
            })
        const firstReload = createRestored()
        await firstReload.restore()
        expect(firstReload.getSnapshot()).toMatchObject({
            selectedId: radio.connection.id,
            devices: [{ state: 'disconnected', readings: {}, connectedAt }],
        })
        expect(firstReload.getSnapshot().devices.filter(isRecentDevice)).toHaveLength(1)
        firstReload.dispose()
        const secondReload = createRestored()
        await secondReload.restore()
        await vi.advanceTimersByTimeAsync(6 * 60 * 1000 - 1)
        expect(secondReload.getSnapshot().devices.filter(isRecentDevice)).toHaveLength(1)
        await vi.advanceTimersByTimeAsync(1)
        expect(secondReload.getSnapshot().devices.filter(isRecentDevice)).toHaveLength(0)
        expect(secondReload.getSnapshot().devices).toHaveLength(1)
        expect(memory.read().devices[0]?.connectedAt).toBe(connectedAt)
        secondReload.dispose()
        expect(vi.getTimerCount()).toBe(0)
    })

    it('starts a new retention window only after a successful reconnect and keeps an active device visible beyond it', async () => {
        vi.useFakeTimers()
        const radio = mockRadio(123)
        const session = createNearbySession(() => Promise.resolve(radio.connection))
        await session.add()
        const firstTime = Date.now()
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
        radio.loseConnection()
        await session.connect(radio.connection.id)
        expect(session.getSnapshot().devices[0]?.connectedAt).toBe(firstTime + 5 * 60 * 1000)
        await vi.advanceTimersByTimeAsync(RECENT_CONNECTION_MS)
        expect(session.getSnapshot().devices[0]?.state).toBe('connected')
        radio.loseConnection()
        await vi.advanceTimersByTimeAsync(0)
        expect(session.getSnapshot().devices.filter(isRecentDevice)).toHaveLength(0)
        session.dispose()
        expect(vi.getTimerCount()).toBe(0)
    })

    it.each([-RECENT_CONNECTION_MS, 60_000])(
        'does not retain an expired or future connection timestamp (%s)',
        async (offset) => {
            const memory = deviceMemory()
            memory.write(
                [{ ...emptyDevice('radio', 'Sensor'), connectedAt: Date.now() + offset }],
                'radio'
            )
            const session = createNearbySession(() => Promise.resolve(null), { memory })
            await session.restore()
            expect(session.getSnapshot().devices.filter(isRecentDevice)).toHaveLength(0)
            expect(session.getSnapshot().selectedId).toBeNull()
            session.dispose()
        }
    )

    it('bounds device lookup and ignores its late result after leaving the page', async () => {
        vi.useFakeTimers()
        const radio = mockRadio(123)
        const memory = deviceMemory()
        memory.write([emptyDevice(radio.connection.id, radio.connection.name)], radio.connection.id)
        const pending = Promise.withResolvers<readonly (typeof radio.connection)[]>()
        const session = createNearbySession(() => Promise.resolve(null), {
            memory,
            known: () => pending.promise,
        })
        const restoring = session.restore()
        await vi.advanceTimersByTimeAsync(5000)
        await restoring
        expect(session.getSnapshot()).toMatchObject({ busy: false, restoration: 'failed' })
        session.dispose()
        pending.resolve([radio.connection])
        await Promise.resolve()
        expect(radio.connection.connect).not.toHaveBeenCalled()
        expect(vi.getTimerCount()).toBe(0)
    })

    it('ends a USB session before opening the Bluetooth chooser so the node can advertise', async () => {
        const usbDone = Promise.withResolvers<undefined>()
        const usb = mockRadio(123)
        const usbConnection = {
            ...usb.connection,
            id: 'usb:1',
            name: '',
            transport: 'usb' as const,
            disconnect: vi.fn(() => usbDone.promise),
        }
        const bluetooth = mockRadio(456)
        const choose = vi.fn((transport: 'bluetooth' | 'usb') =>
            Promise.resolve(transport === 'usb' ? usbConnection : bluetooth.connection)
        )
        const session = createNearbySession(choose)
        await session.add('usb')
        expect(session.getSnapshot().devices[0]?.state).toBe('connected')
        const adding = session.add('bluetooth')
        await Promise.resolve()
        expect(choose).toHaveBeenCalledOnce()
        expect(choose).toHaveBeenCalledWith('usb')
        expect(usbConnection.disconnect).toHaveBeenCalledOnce()
        usbDone.resolve(undefined)
        await adding
        expect(choose).toHaveBeenCalledTimes(2)
        expect(choose).toHaveBeenLastCalledWith('bluetooth')
        expect(session.getSnapshot().devices[0]?.id).toBe(bluetooth.connection.id)
        session.dispose()
    })

    it('leaves the list unchanged when the chooser is canceled', async () => {
        const session = createNearbySession(() => Promise.resolve(null))
        await session.add()
        expect(session.getSnapshot()).toMatchObject({ devices: [], busy: false, error: null })
        session.dispose()
    })

    it('switches connections, preserves readings and rejects callbacks from an older attempt', async () => {
        const first = mockRadio(123)
        const second = mockRadio(456)
        const choose = vi
            .fn()
            .mockResolvedValueOnce(first.connection)
            .mockResolvedValueOnce(second.connection)
        const session = createNearbySession(choose)
        await session.add()
        first.send(
            telemetryPacket(123, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 21 }),
            })
        )
        await session.add()
        expect(first.connection.disconnect).toHaveBeenCalledOnce()
        expect(session.getSnapshot().devices.map((device) => device.id)).toEqual([
            second.connection.id,
            first.connection.id,
        ])
        expect(session.getSnapshot().devices[1]?.state).toBe('disconnected')
        expect(
            session.getSnapshot().devices[1]?.readings['environmentMetrics.temperature']?.value
        ).toBe(21)
        expect(session.getSnapshot().devices[0]?.state).toBe('connected')
        first.send(
            telemetryPacket(123, {
                case: 'environmentMetrics',
                value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 99 }),
            })
        )
        expect(
            session.getSnapshot().devices[1]?.readings['environmentMetrics.temperature']?.value
        ).toBe(21)
        await session.connect(first.connection.id)
        expect(session.getSnapshot().devices[0]?.id).toBe(first.connection.id)
        expect(second.connection.disconnect).toHaveBeenCalledOnce()
        session.dispose()
    })

    it('selects an already-added device without duplicating connections', async () => {
        const radio = mockRadio(123)
        const session = createNearbySession(() => Promise.resolve(radio.connection))
        await session.add()
        await session.add()
        expect(session.getSnapshot().devices).toHaveLength(1)
        expect(radio.connection.connect).toHaveBeenCalledOnce()
        session.remove(radio.connection.id)
        expect(session.getSnapshot().devices).toEqual([])
        session.dispose()
    })

    it('handles unexpected loss and reconnects without accepting old listeners', async () => {
        const radio = mockRadio(123)
        const session = createNearbySession(() => Promise.resolve(radio.connection))
        await session.add()
        radio.loseConnection()
        expect(session.getSnapshot().devices[0]?.state).toBe('disconnected')
        await session.connect(radio.connection.id)
        radio.receivers[0]?.(
            telemetryPacket(123, {
                case: 'deviceMetrics',
                value: create(Telemetry.DeviceMetricsSchema, { batteryLevel: 1 }),
            })
        )
        expect(session.getSnapshot().devices[0]?.readings).toEqual({})
        radio.send(
            telemetryPacket(123, {
                case: 'deviceMetrics',
                value: create(Telemetry.DeviceMetricsSchema, { batteryLevel: 90 }),
            })
        )
        expect(
            session.getSnapshot().devices[0]?.readings['deviceMetrics.batteryLevel']?.value
        ).toBe(90)
        session.dispose()
    })

    it('times out and permits retry when the device never completes initialization', async () => {
        vi.useFakeTimers()
        const radio = mockRadio(123)
        const connection = {
            ...radio.connection,
            connect: vi.fn<typeof radio.connection.connect>(() => Promise.resolve()),
        }
        const session = createNearbySession(() => Promise.resolve(connection))
        const adding = session.add()
        await vi.advanceTimersByTimeAsync(30_000)
        await adding
        expect(session.getSnapshot()).toMatchObject({ busy: false, error: 'timeout' })
        expect(session.getSnapshot().devices[0]?.state).toBe('disconnected')
        connection.connect.mockImplementation(radio.connection.connect)
        await session.connect(connection.id)
        expect(session.getSnapshot().devices[0]?.state).toBe('connected')
        session.dispose()
    })

    it('bounds a GATT opening that hangs even after sending configuration completion', async () => {
        vi.useFakeTimers()
        const radio = mockRadio(123)
        const connection = {
            ...radio.connection,
            connect: vi.fn((...args: Parameters<typeof radio.connection.connect>) => {
                void radio.connection.connect(...args)
                return new Promise<void>(() => {})
            }),
        }
        const session = createNearbySession(() => Promise.resolve(connection))
        const adding = session.add()
        await vi.advanceTimersByTimeAsync(30_000)
        await adding
        expect(session.getSnapshot().error).toBe('timeout')
        expect(session.getSnapshot().devices[0]?.state).toBe('disconnected')
        session.dispose()
    })

    it('does not add a late chooser result after leaving the page', async () => {
        const pending = Promise.withResolvers<ReturnType<typeof mockRadio>['connection']>()
        const session = createNearbySession(() => pending.promise)
        const adding = session.add()
        session.dispose()
        pending.resolve(mockRadio(123).connection)
        await adding
        expect(session.getSnapshot().devices).toEqual([])
    })

    it('sanitizes errors and keeps device configuration out of the UI error', async () => {
        const session = createNearbySession(() =>
            Promise.reject(new DOMException('secret-token', 'NotAllowedError'))
        )
        await session.add()
        expect(session.getSnapshot().error).toBe('permission')
        expect(JSON.stringify(session.getSnapshot())).not.toContain('secret-token')
        session.dispose()
    })
})

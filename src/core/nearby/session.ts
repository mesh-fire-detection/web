import { addActivity, emptyDevice, isRecentDevice, RECENT_CONNECTION_MS } from '@core/nearby/model'
import type { ConnectionError, Device, Snapshot, Transport } from '@core/nearby/model'
import type * as RadioProtocol from '@core/nearby/protocol'
import { restoreDevices } from '@core/nearby/storage/devices'
import type { DeviceMemory } from '@core/nearby/storage/devices'
import { historyChanges, mergeHistory } from '@core/nearby/storage/readings'
import type { ReadingStore } from '@core/nearby/storage/readings'
import { BluetoothUnavailableError } from '@core/nearby/transport/bluetooth'
import type { RadioConnection } from '@core/nearby/transport/bluetooth'

const TIMEOUT_MS = 30_000
/** How long a removal from the list can be undone. */
const UNDO_MS = 10_000

function connectionError(error: unknown): ConnectionError {
    if (error instanceof BluetoothUnavailableError) return 'adapter'
    if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'permission'
        if (error.name === 'NotFoundError' || error.name === 'NotSupportedError')
            return 'unsupported'
        if (error.name === 'TimeoutError') return 'timeout'
    }
    return 'connection'
}

export function createNearbySession(
    choose: (transport: Transport) => Promise<RadioConnection | null>,
    options: {
        readonly memory?: DeviceMemory
        readonly readings?: ReadingStore
        readonly known?: () => Promise<readonly RadioConnection[] | null>
        readonly loadProtocol?: () => Promise<typeof RadioProtocol>
    } = {}
) {
    const initialDevices = restoreDevices(options.memory?.read().devices ?? [])
    let snapshot: Snapshot = {
        devices: initialDevices,
        selectedId: initialDevices.find(isRecentDevice)?.id ?? null,
        busy: initialDevices.length > 0,
        error: null,
        announcement: null,
        restoration: initialDevices.length > 0 ? 'checking' : null,
        removed: null,
    }
    const listeners = new Set<() => void>()
    const connections = new Map<string, RadioConnection>()
    let active: string | null = null
    let generation = 0
    let cancelAttempt: (() => void) | undefined
    let disposed = false
    let restored = false
    let memoryReady = false
    let rememberedActive: string | null = null
    let protocolPromise: Promise<typeof RadioProtocol> | undefined
    let recentTimer: ReturnType<typeof setTimeout> | undefined
    let undo: { index: number; connection: RadioConnection | undefined } | undefined
    let undoTimer: ReturnType<typeof setTimeout> | undefined
    const isDisposed = () => disposed
    const downloadProtocol = async () => {
        try {
            return await (options.loadProtocol ?? (() => import('@core/nearby/protocol')))()
        } catch (error) {
            protocolPromise = undefined
            throw error
        }
    }
    const protocol = () => {
        protocolPromise ??= downloadProtocol()
        return protocolPromise
    }

    const publish = (next: Snapshot) => {
        if (disposed) return
        snapshot = next
        if (memoryReady) options.memory?.write(next.devices, rememberedActive)
        clearTimeout(recentTimer)
        recentTimer = undefined
        const deadlines = next.devices
            .filter(isRecentDevice)
            .map((device) => device.recentUntil ?? 0)
        if (deadlines.length > 0) {
            recentTimer = setTimeout(
                () => {
                    const now = Date.now()
                    publish({
                        ...snapshot,
                        devices: snapshot.devices.map((device) =>
                            isRecentDevice(device) && (device.recentUntil ?? 0) <= now
                                ? { ...device, recentUntil: null }
                                : device
                        ),
                    })
                },
                Math.max(0, Math.min(...deadlines) - Date.now())
            )
        }
        for (const listener of listeners) listener()
    }
    /** Device IDs whose stored history has been read, or is being read. */
    const hydrated = new Set<string>()
    /**
     * Reads a node's stored history once its number is known and merges it in.
     * History the device already carries (from an older localStorage save, or
     * from packets that arrived first) is written back, so nothing is lost.
     */
    const hydrate = (device: Device) => {
        const store = options.readings
        const nodeNum = device.nodeNum
        if (!store || nodeNum === null || hydrated.has(device.id)) return
        hydrated.add(device.id)
        for (const [metric, samples] of Object.entries(device.history))
            void store.apply(nodeNum, metric, { put: samples, remove: [] })
        void (async () => {
            const stored = await store.load(nodeNum)
            if (disposed) return
            publish({
                ...snapshot,
                devices: snapshot.devices.map((entry) =>
                    entry.id === device.id && entry.nodeNum === nodeNum
                        ? { ...entry, history: mergeHistory(stored, entry.history) }
                        : entry
                ),
            })
        })()
    }
    /** Writes the samples a packet added; hydration merges go through `publish` alone. */
    const persist = (previous: Device, next: Device) => {
        const store = options.readings
        if (!store) return
        if (
            next.nodeNum !== previous.nodeNum ||
            next.lastPacketAt !== previous.lastPacketAt ||
            next.configuration !== previous.configuration ||
            next.peers !== previous.peers ||
            next.activity !== previous.activity
        )
            void store.saveObservation(next)
        if (next.nodeNum === null || next.history === previous.history) return
        for (const [metric, samples] of Object.entries(next.history)) {
            const before = previous.history[metric]
            if (samples !== before)
                void store.apply(next.nodeNum, metric, historyChanges(before, samples))
        }
    }
    const update = (id: string, change: (device: Device) => Device) => {
        const previous = snapshot.devices.find((device) => device.id === id)
        publish({
            ...snapshot,
            devices: snapshot.devices.map((device) => (device.id === id ? change(device) : device)),
        })
        const next = snapshot.devices.find((device) => device.id === id)
        if (!previous || !next) return
        persist(previous, next)
        hydrate(next)
    }
    // Most recently connected first; the saved order carries this across reloads.
    const promote = (id: string): readonly Device[] => {
        const device = snapshot.devices.find((entry) => entry.id === id)
        return device
            ? [device, ...snapshot.devices.filter((entry) => entry.id !== id)]
            : snapshot.devices
    }
    const disconnect = async (id: string, explicit = true): Promise<void> => {
        const wasActive = active === id
        if (explicit && rememberedActive === id) rememberedActive = null
        if (wasActive) {
            generation += 1
            active = null
            cancelAttempt?.()
            cancelAttempt = undefined
        }
        const pending = connections.get(id)?.disconnect()
        update(id, (device) => {
            const next: Device = {
                ...device,
                state: 'disconnected',
                ...(explicit && { connectedAt: null, recentUntil: null }),
            }
            return device.state === 'disconnected'
                ? next
                : addActivity(next, 'Disconnected', Date.now())
        })
        if (pending) {
            publish({
                ...snapshot,
                busy: true,
                announcement: 'disconnected',
            })
            await pending
            if (!isDisposed()) publish({ ...snapshot, busy: false })
            return
        }
        publish({
            ...snapshot,
            busy: wasActive ? false : snapshot.busy,
            announcement: 'disconnected',
        })
    }

    const connect = async (id: string): Promise<void> => {
        if (disposed || snapshot.busy) return
        const connection = connections.get(id)
        if (snapshot.devices.find((device) => device.id === id)?.state === 'connected') return
        if (!connection) {
            await add(snapshot.devices.find((device) => device.id === id)?.transport)
            return
        }
        if (active !== null) await disconnect(active)
        if (isDisposed()) return
        const attempt = ++generation
        active = id
        const nonce = Math.max(1, crypto.getRandomValues(new Uint32Array(1))[0] ?? 1)
        publish({
            ...snapshot,
            selectedId: id,
            busy: true,
            error: null,
            announcement: 'connecting',
        })
        update(id, (device) =>
            addActivity({ ...device, state: 'connecting' }, 'Connecting', Date.now())
        )
        let identityReceived = false
        let timeout: ReturnType<typeof setTimeout> | undefined
        const ready = Promise.withResolvers<undefined>()
        const deadline = new Promise<never>((_resolve, reject) => {
            cancelAttempt = () => {
                reject(new DOMException('Disconnected', 'AbortError'))
            }
            timeout = setTimeout(() => {
                reject(new DOMException('Timed out', 'TimeoutError'))
            }, TIMEOUT_MS)
        })
        const current = () => !disposed && generation === attempt
        const openConnection = async () => {
            const codec = await protocol()
            if (!current()) throw new DOMException('Connection closed', 'AbortError')
            return connection.connect(
                codec.configurationRequest(nonce),
                (bytes) => {
                    if (!current()) return
                    update(id, (device) => {
                        const initialized =
                            device.state === 'connecting'
                                ? {
                                      ...device,
                                      state: 'initializing' as const,
                                  }
                                : device
                        identityReceived ||= codec.localNodeNum(bytes) !== null
                        const next = codec.receiveRadio(
                            identityReceived ? initialized : { ...initialized, nodeNum: null },
                            bytes,
                            Date.now(),
                            nonce
                        )
                        return { ...next, nodeNum: next.nodeNum ?? device.nodeNum }
                    })
                    const state = snapshot.devices.find((device) => device.id === id)?.state
                    if (state === 'connected') ready.resolve(undefined)
                    else if (state === 'disconnected') void disconnect(id, false)
                },
                () => {
                    if (current()) void disconnect(id, false)
                }
            )
        }
        try {
            const opening = openConnection()
            await Promise.race([Promise.all([opening, ready.promise]), deadline])
            if (current()) {
                rememberedActive = id
                const now = Date.now()
                update(id, (device) => ({
                    ...device,
                    connectedAt: now,
                    recentUntil: now + RECENT_CONNECTION_MS,
                }))
                publish({
                    ...snapshot,
                    devices: promote(id),
                    busy: false,
                    announcement: 'connected',
                })
            }
        } catch (error) {
            if (current()) {
                void disconnect(id, false)
                publish({
                    ...snapshot,
                    error: connectionError(error),
                    announcement: 'failed',
                })
            }
        } finally {
            if (timeout !== undefined) clearTimeout(timeout)
            if (current()) cancelAttempt = undefined
        }
    }

    const add = async (transport: Transport = 'bluetooth'): Promise<void> => {
        if (disposed || snapshot.busy) return
        publish({ ...snapshot, busy: true, error: null })
        try {
            // USB turns the node's Bluetooth advertising off. End that session and
            // wait for the goodbye so the node is visible in the browser chooser.
            const current = snapshot.devices.find((device) => device.id === active)
            if (transport === 'bluetooth' && current?.transport === 'usb')
                await disconnect(current.id)
            if (isDisposed()) return
            const selection = generation
            publish({ ...snapshot, busy: true, error: null })
            const connection = await choose(transport)
            if (selection !== generation || isDisposed()) return
            publish({ ...snapshot, busy: false })
            if (!connection) return
            const existing = snapshot.devices.find((device) => device.id === connection.id)
            if (existing) {
                publish({ ...snapshot, selectedId: existing.id })
                if (existing.state === 'disconnected') {
                    connections.set(connection.id, connection)
                    await connect(existing.id)
                }
                return
            }
            connections.set(connection.id, connection)
            publish({
                ...snapshot,
                devices: [
                    emptyDevice(connection.id, connection.name, connection.transport),
                    ...snapshot.devices,
                ],
            })
            await connect(connection.id)
        } catch (error) {
            publish({ ...snapshot, busy: false, error: connectionError(error) })
        }
    }

    return {
        async prepare() {
            // Warm the codec after rendering; failed downloads can be retried on connection.
            try {
                await protocol()
            } catch {
                // Connection actions retry a failed background download.
            }
        },
        getSnapshot: () => snapshot,
        subscribe: (listener: () => void) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        async restore() {
            if (disposed || restored) return
            const saved = options.memory?.read()
            memoryReady = true
            rememberedActive = saved?.activeId ?? null
            if (!saved || saved.devices.length === 0) {
                restored = true
                return
            }
            const attempt = ++generation
            const current = () => !disposed && generation === attempt
            let devices = restoreDevices(saved.devices)
            if (options.readings) {
                const store = options.readings
                devices = await Promise.all(
                    devices.map(async (device) => {
                        const stored = await store.loadObservation(device.id)
                        return stored?.nodeNum === device.nodeNum
                            ? { ...device, ...stored }
                            : device
                    })
                )
                if (!current()) return
            }
            publish({
                ...snapshot,
                devices,
                selectedId: devices.find(isRecentDevice)?.id ?? null,
                busy: true,
                restoration: 'checking',
            })
            for (const device of devices) hydrate(device)
            let timeout: ReturnType<typeof setTimeout> | undefined
            const deadline = new Promise<never>((_resolve, reject) => {
                cancelAttempt = () => {
                    reject(new DOMException('Canceled', 'AbortError'))
                }
                timeout = setTimeout(() => {
                    reject(new DOMException('Timed out', 'TimeoutError'))
                }, 5000)
            })
            try {
                const known = await Promise.race([
                    options.known?.() ?? Promise.resolve(null),
                    deadline,
                ])
                if (!current()) return
                restored = true
                const allowed = known ?? []
                for (const connection of allowed) {
                    if (saved.devices.some((device) => device.id === connection.id))
                        connections.set(connection.id, connection)
                }
                publish({
                    ...snapshot,
                    busy: false,
                    restoration: known === null ? 'unsupported' : null,
                })
            } catch {
                if (!current()) return
                restored = true
                publish({ ...snapshot, busy: false, restoration: 'failed' })
            } finally {
                if (timeout !== undefined) clearTimeout(timeout)
                if (current()) cancelAttempt = undefined
            }
            if (rememberedActive && current() && connections.has(rememberedActive))
                await connect(rememberedActive)
        },
        add,
        connect,
        disconnect,
        activate() {
            disposed = false
        },
        select(id: string) {
            publish({ ...snapshot, selectedId: id })
        },
        remove(id: string) {
            void disconnect(id)
            const index = snapshot.devices.findIndex((device) => device.id === id)
            const removed = snapshot.devices[index]
            if (!removed) return
            undo = { index, connection: connections.get(id) }
            connections.delete(id)
            void options.readings?.removeObservation(id)
            const devices = snapshot.devices.filter((device) => device.id !== id)
            publish({
                ...snapshot,
                devices,
                selectedId:
                    snapshot.selectedId === id ? (devices[0]?.id ?? null) : snapshot.selectedId,
                removed,
                announcement: 'removed',
            })
            clearTimeout(undoTimer)
            undoTimer = setTimeout(() => {
                undo = undefined
                publish({ ...snapshot, removed: null })
            }, UNDO_MS)
        },
        undoRemove() {
            const removed = snapshot.removed
            if (!removed || !undo) return
            clearTimeout(undoTimer)
            // Adding the same device again in the meantime already brought it back.
            if (snapshot.devices.some((device) => device.id === removed.id)) {
                undo = undefined
                publish({ ...snapshot, removed: null })
                return
            }
            if (undo.connection) connections.set(removed.id, undo.connection)
            void options.readings?.saveObservation(removed)
            const devices = [...snapshot.devices]
            devices.splice(undo.index, 0, removed)
            undo = undefined
            publish({
                ...snapshot,
                devices,
                selectedId: removed.id,
                removed: null,
                announcement: 'restored',
            })
        },
        dispose() {
            disposed = true
            generation += 1
            clearTimeout(recentTimer)
            clearTimeout(undoTimer)
            cancelAttempt?.()
            for (const connection of connections.values()) void connection.disconnect()
            connections.clear()
            listeners.clear()
        },
    }
}

export type NearbySession = ReturnType<typeof createNearbySession>

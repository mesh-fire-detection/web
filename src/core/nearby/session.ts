import type { RadioConnection } from '@core/nearby/bluetooth'
import { addActivity, emptyDevice, isRecentDevice, RECENT_CONNECTION_MS } from '@core/nearby/model'
import type { ConnectionError, Device, Snapshot } from '@core/nearby/model'
import type * as RadioProtocol from '@core/nearby/protocol'
import type { DeviceMemory } from '@core/nearby/remembered'

const TIMEOUT_MS = 30_000

function restoreDevices(saved: ReturnType<DeviceMemory['read']>['devices']): readonly Device[] {
    const now = Date.now()
    return saved.map((device) => {
        const connectedAt = device.connectedAt ?? null
        const recentUntil =
            connectedAt !== null && connectedAt <= now && now < connectedAt + RECENT_CONNECTION_MS
                ? connectedAt + RECENT_CONNECTION_MS
                : null
        return {
            ...emptyDevice(device.id, device.bluetoothName),
            name: device.name,
            nodeNum: device.nodeNum,
            connectedAt,
            recentUntil,
            history: device.history ?? {},
            readings: Object.fromEntries(
                (device.readings ?? []).map((reading) => [reading.metric, reading])
            ),
        }
    })
}

function connectionError(error: unknown): ConnectionError {
    if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'permission'
        if (error.name === 'NotFoundError' || error.name === 'NotSupportedError')
            return 'unsupported'
        if (error.name === 'TimeoutError') return 'timeout'
    }
    return 'connection'
}

export function createNearbySession(
    choose: () => Promise<RadioConnection | null>,
    options: {
        readonly memory?: DeviceMemory
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
        announcement: '',
        restoration: initialDevices.length > 0 ? 'checking' : null,
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
    const update = (id: string, change: (device: Device) => Device) => {
        publish({
            ...snapshot,
            devices: snapshot.devices.map((device) => (device.id === id ? change(device) : device)),
        })
    }
    // Most recently connected first; the saved order carries this across reloads.
    const promote = (id: string): readonly Device[] => {
        const device = snapshot.devices.find((entry) => entry.id === id)
        return device
            ? [device, ...snapshot.devices.filter((entry) => entry.id !== id)]
            : snapshot.devices
    }
    const disconnect = (id: string, explicit = true) => {
        const wasActive = active === id
        if (explicit && rememberedActive === id) rememberedActive = null
        if (wasActive) {
            generation += 1
            active = null
            cancelAttempt?.()
            cancelAttempt = undefined
        }
        connections.get(id)?.disconnect()
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
        publish({
            ...snapshot,
            busy: wasActive ? false : snapshot.busy,
            announcement: 'Disconnected',
        })
    }

    const connect = async (id: string): Promise<void> => {
        if (disposed || snapshot.busy) return
        const connection = connections.get(id)
        if (snapshot.devices.find((device) => device.id === id)?.state === 'connected') return
        if (!connection) {
            await add()
            return
        }
        if (active !== null) disconnect(active)
        const attempt = ++generation
        active = id
        const nonce = Math.max(1, crypto.getRandomValues(new Uint32Array(1))[0] ?? 1)
        publish({
            ...snapshot,
            selectedId: id,
            busy: true,
            error: null,
            announcement: 'Connecting',
        })
        update(id, (device) =>
            addActivity({ ...device, state: 'connecting', nodeNum: null }, 'Connecting', Date.now())
        )
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
                        return codec.receiveRadio(initialized, bytes, Date.now(), nonce)
                    })
                    const state = snapshot.devices.find((device) => device.id === id)?.state
                    if (state === 'connected') ready.resolve(undefined)
                    else if (state === 'disconnected') disconnect(id, false)
                },
                () => {
                    if (current()) disconnect(id, false)
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
                    announcement: 'Connected',
                })
            }
        } catch (error) {
            if (current()) {
                disconnect(id, false)
                publish({
                    ...snapshot,
                    error: connectionError(error),
                    announcement: 'Connection failed',
                })
            }
        } finally {
            if (timeout !== undefined) clearTimeout(timeout)
            if (current()) cancelAttempt = undefined
        }
    }

    const add = async (): Promise<void> => {
        if (disposed || snapshot.busy) return
        const selection = generation
        publish({ ...snapshot, busy: true, error: null })
        try {
            const connection = await choose()
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
                devices: [emptyDevice(connection.id, connection.name), ...snapshot.devices],
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
            const devices = restoreDevices(saved.devices)
            publish({
                ...snapshot,
                devices,
                selectedId: devices.find(isRecentDevice)?.id ?? null,
                busy: true,
                restoration: 'checking',
            })
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
            disconnect(id)
            connections.delete(id)
            const devices = snapshot.devices.filter((device) => device.id !== id)
            publish({
                ...snapshot,
                devices,
                selectedId:
                    snapshot.selectedId === id ? (devices[0]?.id ?? null) : snapshot.selectedId,
            })
        },
        dispose() {
            disposed = true
            generation += 1
            clearTimeout(recentTimer)
            cancelAttempt?.()
            for (const connection of connections.values()) connection.disconnect()
            connections.clear()
            listeners.clear()
        },
    }
}

export type NearbySession = ReturnType<typeof createNearbySession>

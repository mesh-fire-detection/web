import {
    addActivity,
    emptyNode,
    isRecentNode,
    RECENT_CONNECTION_MS,
    usbNodeId,
} from '@core/nearby/model'
import type { ConnectionError, NearbyNode, Snapshot, Transport } from '@core/nearby/model'
import type * as RadioProtocol from '@core/nearby/protocol'
import { restoreNodes } from '@core/nearby/storage/nodes'
import type { NodeMemory } from '@core/nearby/storage/nodes'
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

/**
 * The entry a chosen connection opens: the same Bluetooth node, or for USB the
 * node last reached through that port, most recently connected first.
 */
function knownNode<Entry extends Pick<NearbyNode, 'id'> & { readonly port?: string | null }>(
    nodes: readonly Entry[],
    connection: RadioConnection
): Entry | undefined {
    return (
        nodes.find((node) => node.id === connection.id) ??
        (connection.transport === 'usb'
            ? nodes.find((node) => node.port === connection.id)
            : undefined)
    )
}

export function createNearbySession(
    choose: (transport: Transport) => Promise<RadioConnection | null>,
    options: {
        readonly memory?: NodeMemory
        readonly readings?: ReadingStore
        readonly known?: () => Promise<readonly RadioConnection[] | null>
        readonly loadProtocol?: () => Promise<typeof RadioProtocol>
    } = {}
) {
    const initialNodes = restoreNodes(options.memory?.read().nodes ?? [])
    let snapshot: Snapshot = {
        nodes: initialNodes,
        selectedId: initialNodes.find(isRecentNode)?.id ?? null,
        busy: initialNodes.length > 0,
        error: null,
        announcement: null,
        restoration: initialNodes.length > 0 ? 'checking' : null,
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
        if (memoryReady) options.memory?.write(next.nodes, rememberedActive)
        clearTimeout(recentTimer)
        recentTimer = undefined
        const deadlines = next.nodes.filter(isRecentNode).map((node) => node.recentUntil ?? 0)
        if (deadlines.length > 0) {
            recentTimer = setTimeout(
                () => {
                    const now = Date.now()
                    publish({
                        ...snapshot,
                        nodes: snapshot.nodes.map((node) =>
                            isRecentNode(node) && (node.recentUntil ?? 0) <= now
                                ? { ...node, recentUntil: null }
                                : node
                        ),
                    })
                },
                Math.max(0, Math.min(...deadlines) - Date.now())
            )
        }
        for (const listener of listeners) listener()
    }
    /** NearbyNode ID and node number pairs whose stored history has been read, or is being read. */
    const hydrated = new Set<string>()
    /**
     * Reads a node's stored history once its number is known and merges it in.
     * History the node already carries (from an older localStorage save, or
     * from packets that arrived first) is written back, so nothing is lost.
     */
    const hydrate = (node: NearbyNode) => {
        const store = options.readings
        const nodeNum = node.nodeNum
        const key = `${node.id}:${String(nodeNum)}`
        if (!store || nodeNum === null || hydrated.has(key)) return
        hydrated.add(key)
        for (const [metric, samples] of Object.entries(node.history))
            void store.apply(nodeNum, metric, { put: samples, remove: [] })
        void (async () => {
            const stored = await store.load(nodeNum)
            if (disposed) return
            publish({
                ...snapshot,
                nodes: snapshot.nodes.map((entry) =>
                    entry.id === node.id && entry.nodeNum === nodeNum
                        ? { ...entry, history: mergeHistory(stored, entry.history) }
                        : entry
                ),
            })
        })()
    }
    /** Writes the samples a packet added; hydration merges go through `publish` alone. */
    const persist = (previous: NearbyNode, next: NearbyNode) => {
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
    const update = (id: string, change: (node: NearbyNode) => NearbyNode) => {
        const previous = snapshot.nodes.find((node) => node.id === id)
        publish({
            ...snapshot,
            nodes: snapshot.nodes.map((node) => (node.id === id ? change(node) : node)),
        })
        const next = snapshot.nodes.find((node) => node.id === id)
        if (!previous || !next) return
        persist(previous, next)
        hydrate(next)
    }
    // Most recently connected first; the saved order carries this across reloads.
    const promote = (id: string): readonly NearbyNode[] => {
        const node = snapshot.nodes.find((entry) => entry.id === id)
        return node ? [node, ...snapshot.nodes.filter((entry) => entry.id !== id)] : snapshot.nodes
    }
    /**
     * Moves a USB session onto the entry of the node that answered. Equal boards
     * share a port ID, so the entry opened may belong to another node; that entry
     * stays in the list, disconnected, and the session continues on the right one.
     */
    const claim = (fromId: string, num: number): string => {
        const from = snapshot.nodes.find((node) => node.id === fromId)
        const targetId = usbNodeId(num)
        if (fromId === targetId || from?.transport !== 'usb') return fromId
        const existing = snapshot.nodes.find((node) => node.id === targetId)
        // An entry never identified, or saved under its port ID, becomes the node's entry.
        const adopt = from.nodeNum === null || from.nodeNum === num
        const connection = connections.get(fromId)
        const target: NearbyNode = {
            ...(existing ?? (adopt ? from : emptyNode(targetId, from.bluetoothName, 'usb'))),
            id: targetId,
            port: connection?.id ?? from.port,
            state: from.state,
        }
        // The other node's entry keeps its history; one saved under its port ID is
        // renamed, or the port would keep opening it ahead of the node's own entry.
        const leftId = from.nodeNum === null ? fromId : usbNodeId(from.nodeNum)
        const left: readonly NearbyNode[] =
            adopt || (leftId !== fromId && snapshot.nodes.some((node) => node.id === leftId))
                ? []
                : [{ ...from, id: leftId, state: 'disconnected' }]
        connections.delete(fromId)
        if (connection) connections.set(targetId, connection)
        if (leftId !== fromId || adopt) void options.readings?.removeObservation(fromId)
        const [kept] = left
        if (kept && kept.id !== fromId) void options.readings?.saveObservation(kept)
        active = targetId
        publish({
            ...snapshot,
            selectedId: snapshot.selectedId === fromId ? targetId : snapshot.selectedId,
            nodes: snapshot.nodes.flatMap((node) =>
                node.id === fromId ? [target, ...left] : node.id === targetId ? [] : [node]
            ),
        })
        return targetId
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
        update(id, (node) => {
            const next: NearbyNode = {
                ...node,
                state: 'disconnected',
                ...(explicit && { connectedAt: null, recentUntil: null }),
            }
            return node.state === 'disconnected'
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
        if (snapshot.nodes.find((node) => node.id === id)?.state === 'connected') return
        if (!connection) {
            await add(snapshot.nodes.find((node) => node.id === id)?.transport)
            return
        }
        if (active !== null) await disconnect(active)
        if (isDisposed()) return
        const attempt = ++generation
        active = id
        // A USB session moves to the answering node's entry once it reports its number.
        let nodeId = id
        const nonce = Math.max(1, crypto.getRandomValues(new Uint32Array(1))[0] ?? 1)
        publish({
            ...snapshot,
            selectedId: id,
            busy: true,
            error: null,
            announcement: 'connecting',
        })
        update(id, (node) =>
            addActivity({ ...node, state: 'connecting' }, 'Connecting', Date.now())
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
                    const num = codec.localNodeNum(bytes)
                    if (num !== null) {
                        identityReceived = true
                        nodeId = claim(nodeId, num)
                    }
                    update(nodeId, (node) => {
                        const initialized =
                            node.state === 'connecting'
                                ? {
                                      ...node,
                                      state: 'initializing' as const,
                                  }
                                : node
                        const next = codec.receiveRadio(
                            identityReceived ? initialized : { ...initialized, nodeNum: null },
                            bytes,
                            Date.now(),
                            nonce
                        )
                        return { ...next, nodeNum: next.nodeNum ?? node.nodeNum }
                    })
                    const state = snapshot.nodes.find((node) => node.id === nodeId)?.state
                    if (state === 'connected') ready.resolve(undefined)
                    else if (state === 'disconnected') void disconnect(nodeId, false)
                },
                () => {
                    if (current()) void disconnect(nodeId, false)
                }
            )
        }
        try {
            const opening = openConnection()
            await Promise.race([Promise.all([opening, ready.promise]), deadline])
            if (current()) {
                rememberedActive = nodeId
                const now = Date.now()
                update(nodeId, (node) => ({
                    ...node,
                    connectedAt: now,
                    recentUntil: now + RECENT_CONNECTION_MS,
                }))
                publish({
                    ...snapshot,
                    nodes: promote(nodeId),
                    busy: false,
                    announcement: 'connected',
                })
            }
        } catch (error) {
            if (current()) {
                void disconnect(nodeId, false)
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
            const current = snapshot.nodes.find((node) => node.id === active)
            if (transport === 'bluetooth' && current?.transport === 'usb')
                await disconnect(current.id)
            if (isDisposed()) return
            const selection = generation
            publish({ ...snapshot, busy: true, error: null })
            const connection = await choose(transport)
            if (selection !== generation || isDisposed()) return
            publish({ ...snapshot, busy: false })
            if (!connection) return
            const existing = knownNode(snapshot.nodes, connection)
            if (existing) {
                publish({ ...snapshot, selectedId: existing.id })
                if (existing.state === 'disconnected') {
                    connections.set(existing.id, connection)
                    await connect(existing.id)
                }
                return
            }
            connections.set(connection.id, connection)
            publish({
                ...snapshot,
                nodes: [
                    {
                        ...emptyNode(connection.id, connection.name, connection.transport),
                        port: connection.transport === 'usb' ? connection.id : null,
                    },
                    ...snapshot.nodes,
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
            if (!saved || saved.nodes.length === 0) {
                restored = true
                return
            }
            const attempt = ++generation
            const current = () => !disposed && generation === attempt
            let nodes = restoreNodes(saved.nodes)
            if (options.readings) {
                const store = options.readings
                nodes = await Promise.all(
                    nodes.map(async (node) => {
                        const stored = await store.loadObservation(node.id)
                        return stored?.nodeNum === node.nodeNum ? { ...node, ...stored } : node
                    })
                )
                if (!current()) return
            }
            publish({
                ...snapshot,
                nodes,
                selectedId: nodes.find(isRecentNode)?.id ?? null,
                busy: true,
                restoration: 'checking',
            })
            for (const node of nodes) hydrate(node)
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
                    const node = knownNode(saved.nodes, connection)
                    if (node && !connections.has(node.id)) connections.set(node.id, connection)
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
            const index = snapshot.nodes.findIndex((node) => node.id === id)
            const removed = snapshot.nodes[index]
            if (!removed) return
            undo = { index, connection: connections.get(id) }
            connections.delete(id)
            void options.readings?.removeObservation(id)
            const nodes = snapshot.nodes.filter((node) => node.id !== id)
            publish({
                ...snapshot,
                nodes,
                selectedId:
                    snapshot.selectedId === id ? (nodes[0]?.id ?? null) : snapshot.selectedId,
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
            // Adding the same node again in the meantime already brought it back.
            if (snapshot.nodes.some((node) => node.id === removed.id)) {
                undo = undefined
                publish({ ...snapshot, removed: null })
                return
            }
            if (undo.connection) connections.set(removed.id, undo.connection)
            void options.readings?.saveObservation(removed)
            const nodes = [...snapshot.nodes]
            nodes.splice(undo.index, 0, removed)
            undo = undefined
            publish({
                ...snapshot,
                nodes,
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

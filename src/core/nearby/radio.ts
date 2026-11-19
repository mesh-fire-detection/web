import { meshId } from '@core/nearby/model'
import type { Snapshot } from '@core/nearby/model'
import type { NearbySession } from '@core/nearby/session'

/** The session and what it last published, together so React sees one value change. */
export type RadioState = { readonly session: NearbySession; readonly snapshot: Snapshot }

/**
 * Holds this tab's one radio session for the whole site, so a node connected on
 * `/connect` stays connected while the person reads other pages. Nothing starts
 * until `/connect` asks for it: a tab that never opens that page never reaches
 * for a radio, and two tabs do not race to reconnect the same node.
 */
export function createRadio(create: () => NearbySession) {
    let state: RadioState | null = null
    let woken = false
    const listeners = new Set<() => void>()
    const notify = () => {
        for (const listener of listeners) listener()
    }

    /** Makes the session if there is none. Quiet, so it is safe while rendering. */
    function ensure(): RadioState {
        if (state !== null) return state
        const session = create()
        const current: RadioState = { session, snapshot: session.getSnapshot() }
        state = current
        woken = false
        session.subscribe(() => {
            if (state?.session !== session) return
            state = { session, snapshot: session.getSnapshot() }
            notify()
        })
        return current
    }

    return {
        ensure,
        getState: (): RadioState | null => state,
        subscribe: (listener: () => void) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        /** Starts the session after rendering: restores saved nodes and reconnects the last one. */
        wake() {
            const { session } = ensure()
            if (woken) return
            woken = true
            session.activate()
            void session.prepare()
            void session.restore()
            notify()
        },
        /** Closes every connection. The next `/connect` visit starts a new session. */
        dispose() {
            if (state === null) return
            const { session } = state
            state = null
            woken = false
            session.dispose()
            notify()
        },
    }
}

export type Radio = ReturnType<typeof createRadio>

/** Mesh IDs of the nodes connected to this tab right now. */
export function connectedMeshIds(snapshot: Snapshot | null): ReadonlySet<string> {
    const ids = new Set<string>()
    const nodes = snapshot?.nodes ?? []
    for (const node of nodes) {
        if (node.state === 'connected' && node.nodeNum !== null) ids.add(meshId(node.nodeNum))
    }
    return ids
}

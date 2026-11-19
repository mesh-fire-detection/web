import { describe, expect, it, vi } from 'vitest'

import { emptyNode, type Snapshot } from '@core/nearby/model'
import { connectedMeshIds, createRadio } from '@core/nearby/radio'
import { createNearbySession } from '@core/nearby/session'

function radioWithCount() {
    const made = { count: 0 }
    const radio = createRadio(() => {
        made.count += 1
        return createNearbySession(() => Promise.resolve(null))
    })
    return { radio, made }
}

describe('createRadio', () => {
    it('makes nothing until asked, then one session, quietly', () => {
        const { radio, made } = radioWithCount()
        const heard = vi.fn()
        radio.subscribe(heard)
        expect(radio.getState()).toBeNull()
        const first = radio.ensure()
        expect(radio.ensure()).toBe(first)
        expect(made.count).toBe(1)
        expect(heard).not.toHaveBeenCalled()
        radio.wake()
        expect(heard).toHaveBeenCalledOnce()
    })

    it('starts a new session after closing the last one', () => {
        const { radio, made } = radioWithCount()
        const { session } = radio.ensure()
        radio.wake()
        const dispose = vi.spyOn(session, 'dispose')
        radio.dispose()
        expect(dispose).toHaveBeenCalledOnce()
        expect(radio.getState()).toBeNull()
        radio.wake()
        expect(made.count).toBe(2)
        expect(radio.getState()?.session).not.toBe(session)
    })
})

describe('connectedMeshIds', () => {
    it('lists only nodes connected now, by mesh ID', () => {
        const node = emptyNode('a', 'A')
        const snapshot: Snapshot = {
            nodes: [
                { ...node, state: 'connected', nodeNum: 0x7d_25_8b_79 },
                { ...node, id: 'b', state: 'disconnected', nodeNum: 1 },
                { ...node, id: 'c', state: 'connected', nodeNum: null },
            ],
            selectedId: null,
            busy: false,
            error: null,
            announcement: null,
            restoration: null,
            removed: null,
        }
        expect([...connectedMeshIds(snapshot)]).toEqual(['!7d258b79'])
        expect(connectedMeshIds(null).size).toBe(0)
    })
})

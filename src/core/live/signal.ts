/*
 * Says the server has something new about nodes, such as readings this browser
 * just copied there, so pages showing nodes ask again now instead of at their
 * next turn.
 */
const listeners = new Set<() => void>()

export function announceNodeData(): void {
    for (const listener of listeners) listener()
}

export function onNodeData(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

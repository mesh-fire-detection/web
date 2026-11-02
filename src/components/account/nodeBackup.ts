import { uploadNodeData } from '@core/api/nodes'
import { fetchMyNodes } from '@core/api/people'
import { backUpNodes } from '@core/nearby/backup'
import { createNodeMemory } from '@core/nearby/storage/nodes'
import { createReadingStore } from '@core/nearby/storage/readings'

/** Holds the run in progress, so pages opening at once share it. */
const inFlight: { run: Promise<number> | null } = { run: null }

async function run(): Promise<number> {
    try {
        const store = createReadingStore(() => window.indexedDB)
        return await backUpNodes({
            storage: window.localStorage,
            remembered: () => createNodeMemory(() => window.localStorage).read().nodes,
            mine: fetchMyNodes,
            loadHistory: (nodeNum) => store.load(nodeNum),
            loadObservation: (id) => store.loadObservation(id),
            upload: uploadNodeData,
            now: () => Date.now(),
        })
    } catch {
        // Private mode or blocked storage: nothing saved means nothing to copy.
        return 0
    } finally {
        inFlight.run = null
    }
}

/**
 * Copies what this browser saved to the server, for nodes on the signed-in
 * person's account. Resolves to how many new records arrived; a failure resolves
 * to 0 and the next visit tries again.
 */
export function backUpConnectedNodes(): Promise<number> {
    inFlight.run ??= run()
    return inFlight.run
}

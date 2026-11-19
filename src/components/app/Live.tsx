import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from 'react'

import { Text } from '@components/shared/typography/Text'
import type { ApiResult } from '@core/api/client'
import { nodesContent } from '@core/content/nodes/nodes'
import { sinceMinutes } from '@core/format/format'
import { clockNowEvery, serverNow, serverOffset, subscribeClock } from '@core/live/clock'
import { onNodeData } from '@core/live/signal'

/** How often a page in view asks the server again. The server caches for 30 s. */
export const REFRESH_MS = 60_000
/** Coming back to the tab asks again when the last answer is older than this. */
const RETURN_MS = 10_000

/** What a page has from the server: nothing yet, a failure, or data and when it came. */
export type Live<T> =
    | { readonly kind: 'loading' }
    | { readonly kind: 'failed'; readonly error: string }
    | { readonly kind: 'ready'; readonly data: T; readonly at: number }

const LOADING: Live<never> = { kind: 'loading' }

const same = (left: unknown, right: unknown): boolean =>
    JSON.stringify(left) === JSON.stringify(right)

/** The answer to keep, given the one before: unchanged data keeps its identity. */
function settle<T>(before: Live<T>, result: ApiResult<T>, at: number): Live<T> {
    if (!result.ok) {
        // A refresh that fails keeps what is on screen; only a first load shows it.
        return before.kind === 'ready' ? before : { kind: 'failed', error: result.error }
    }
    const data =
        before.kind === 'ready' && same(before.data, result.data) ? before.data : result.data
    return { kind: 'ready', data, at }
}

/**
 * Server data that stays current while the page is open: fetched on arrival,
 * every minute while the tab is in view, on coming back to the tab or back
 * online, and when this browser has just sent the server something new.
 * Unchanged data keeps its identity, so nothing below it re-renders or refetches.
 *
 * `key` names what is loaded; a new key starts over. `paused` holds refreshes,
 * for a page being edited.
 */
export function useLive<T>(
    key: string,
    load: () => Promise<ApiResult<T>>,
    options: { readonly paused?: boolean } = {}
): {
    readonly live: Live<T>
    /** Starts over from loading, after a failure. */
    readonly retry: () => void
    /** Puts what the server answered elsewhere, such as an edit, in place. */
    readonly replace: (data: T) => void
} {
    const paused = options.paused ?? false
    const [state, setState] = useState<{ readonly key: string; readonly live: Live<T> }>({
        key,
        live: LOADING,
    })
    const [attempt, setAttempt] = useState(0)
    const loaderRef = useRef(load)
    /** When this key last had an answer, so un-pausing right after a save does not ask again. */
    const answeredRef = useRef({ key, at: 0 })
    useEffect(() => {
        loaderRef.current = load
    })

    useEffect(() => {
        if (paused) return
        let current = true
        let busy = false
        const answered = answeredRef.current
        const refresh = async () => {
            if (busy) return
            busy = true
            const result = await loaderRef.current()
            busy = false
            if (!current) return
            const at = serverNow()
            if (result.ok) answeredRef.current = { key, at: Date.now() }
            setState((previous) => ({
                key,
                live: settle(previous.key === key ? previous.live : LOADING, result, at),
            }))
        }
        const inView = () => document.visibilityState === 'visible'
        const timer = setInterval(() => {
            if (inView()) void refresh()
        }, REFRESH_MS)
        const onVisible = () => {
            if (inView() && Date.now() - answeredRef.current.at > RETURN_MS) void refresh()
        }
        const onOnline = () => {
            void refresh()
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('online', onOnline)
        const unsubscribe = onNodeData(onOnline)
        if (answered.key !== key || Date.now() - answered.at > RETURN_MS) void refresh()
        return () => {
            current = false
            clearInterval(timer)
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('online', onOnline)
            unsubscribe()
        }
    }, [key, paused, attempt])

    return {
        live: state.key === key ? state.live : LOADING,
        retry: () => {
            answeredRef.current = { key, at: 0 }
            setState({ key, live: LOADING })
            setAttempt((count) => count + 1)
        },
        replace: (data: T) => {
            answeredRef.current = { key, at: Date.now() }
            setState({ key, live: { kind: 'ready', data, at: serverNow() } })
        },
    }
}

const ServerTimeContext = createContext(false)

/**
 * Marks a part of the page that shows the server's times, so the ages in it
 * count from the server's clock rather than this computer's. Outside it, as on
 * `/connect`, times come from this browser and so does the clock.
 */
export function ServerTime({ children }: { readonly children: ReactNode }) {
    return <ServerTimeContext.Provider value>{children}</ServerTimeContext.Provider>
}

/** The time now, moving in steps of `stepMs`, so ages on screen keep counting. */
export function useNow(stepMs = 1000): number {
    const server = useContext(ServerTimeContext)
    return useSyncExternalStore(
        subscribeClock,
        () => clockNowEvery(stepMs) + (server ? serverOffset() : 0)
    )
}

/** `Updated 2 min ago`: how fresh the page's server data is. */
export function Updated({ at }: { readonly at: number }) {
    const now = useNow(15_000)
    return (
        <Text as='span' size='xs' tone='faint'>
            {nodesContent.updated} {sinceMinutes(Math.max(0, (now - at) / 60_000))}
        </Text>
    )
}

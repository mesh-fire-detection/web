import { vi } from 'vitest'

import type { SessionUser } from '@core/api/auth'

export const MEMBER: SessionUser = {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@example.org',
    role: 'user',
}

/** `offline` rejects like a dropped connection; `pending` never answers. */
type Reply = Response | 'offline' | 'pending'
type Route = `${'GET' | 'POST'} /v1/${string}`

export const json = (body: unknown, status = 200): Response => Response.json(body, { status })

const never = (): Promise<Response> =>
    new Promise<Response>(() => {
        // Left unresolved on purpose: the request is still in flight.
    })

const serve = (reply: Reply): Promise<Response> => {
    if (reply === 'offline') return Promise.reject(new TypeError('Failed to fetch'))
    // A body reads once; a clone lets the same reply serve repeat calls.
    return reply === 'pending' ? never() : Promise.resolve(reply.clone())
}

/**
 * Stubs `fetch` with one reply per route; a route listed with several replies
 * answers with each in turn and repeats the last. Unlisted routes fail the
 * test loudly rather than hanging. Returns the mock so tests can read calls.
 */
export function stubApi(routes: Partial<Record<Route, Reply | readonly Reply[]>>) {
    const served = new Map<string, number>()
    const fetchMock = vi.fn((input: string, init?: RequestInit) => {
        const key = `${init?.method ?? 'GET'} ${new URL(input).pathname}`
        const entry = routes[key as Route]
        if (entry === undefined) throw new Error(`Unexpected request: ${key}`)
        const replies = Array.isArray(entry) ? entry : [entry]
        const index = served.get(key) ?? 0
        served.set(key, index + 1)
        return serve(replies[Math.min(index, replies.length - 1)] as Reply)
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

/** The parsed JSON bodies sent to one route, in order. */
export function sentBodies(fetchMock: ReturnType<typeof stubApi>, path: string): unknown[] {
    return fetchMock.mock.calls
        .filter(([input]) => new URL(input).pathname === path)
        .map(
            ([, init]) => (typeof init?.body === 'string' ? JSON.parse(init.body) : null) as unknown
        )
}

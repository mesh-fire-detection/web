// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { REFRESH_MS, ServerTime, useLive, useNow } from '@components/app/Live'
import type { ApiResult } from '@core/api/client'
import { noteServerDate, serverNow } from '@core/live/clock'
import { announceNodeData } from '@core/live/signal'

type Data = { readonly value: number }

function Probe({
    load,
    paused = false,
    seen = [],
}: {
    readonly load: () => Promise<ApiResult<Data>>
    readonly paused?: boolean
    readonly seen?: Data[]
}) {
    const { live } = useLive('probe', load, { paused })
    if (live.kind === 'ready') seen.push(live.data)
    return <p>{live.kind === 'ready' ? `value ${String(live.data.value)}` : live.kind}</p>
}

/** Answers with each value in turn, repeating the last. */
function answers(...values: readonly (number | 'fail')[]) {
    let index = 0
    return vi.fn(() => {
        const value = values[Math.min(index, values.length - 1)]
        index += 1
        return Promise.resolve<ApiResult<Data>>(
            value === 'fail' || value === undefined
                ? { ok: false, error: 'unreachable' }
                : { ok: true, data: { value } }
        )
    })
}

function setVisibility(state: DocumentVisibilityState) {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: state })
    document.dispatchEvent(new Event('visibilitychange'))
}

async function minutePasses() {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(REFRESH_MS)
    })
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    setVisibility('visible')
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

describe('Server data that stays current', () => {
    it('asks again each minute while the tab is in view, and not while it is hidden', async () => {
        const load = answers(1, 2, 3)
        render(<Probe load={load} />)
        expect(await screen.findByText('value 1')).toBeDefined()

        await minutePasses()
        expect(await screen.findByText('value 2')).toBeDefined()

        setVisibility('hidden')
        await minutePasses()
        expect(load).toHaveBeenCalledTimes(2)

        // Back in view after a while: it asks at once rather than waiting its turn.
        setVisibility('visible')
        expect(await screen.findByText('value 3')).toBeDefined()
    })

    it('keeps what is shown when a refresh fails, and shows a first failure', async () => {
        render(<Probe load={answers(1, 'fail')} />)
        expect(await screen.findByText('value 1')).toBeDefined()
        await minutePasses()
        expect(screen.getByText('value 1')).toBeDefined()

        cleanup()
        render(<Probe load={answers('fail')} />)
        expect(await screen.findByText('failed')).toBeDefined()
    })

    it('asks again at once when this browser has sent the server something new', async () => {
        const load = answers(1, 2)
        render(<Probe load={load} />)
        expect(await screen.findByText('value 1')).toBeDefined()
        act(() => {
            announceNodeData()
        })
        expect(await screen.findByText('value 2')).toBeDefined()
    })

    it('keeps the same data object when nothing changed, so nothing below reloads', async () => {
        const seen: Data[] = []
        const load = answers(1, 1)
        render(<Probe load={load} seen={seen} />)
        await screen.findByText('value 1')
        await minutePasses()
        await waitFor(() => {
            expect(load).toHaveBeenCalledTimes(2)
        })
        expect(new Set(seen).size).toBe(1)
    })

    it('holds refreshes while paused', async () => {
        const load = answers(1, 2)
        const view = render(<Probe load={load} />)
        await screen.findByText('value 1')
        view.rerender(<Probe load={load} paused />)
        await minutePasses()
        expect(load).toHaveBeenCalledOnce()
        expect(screen.getByText('value 1')).toBeDefined()
    })
})

function Clock({ label }: { readonly label: string }) {
    return <p aria-label={label}>{String(useNow())}</p>
}

/** Minutes between a clock on the page and this computer's. */
const offsetOf = (label: string) =>
    Math.round((Number(screen.getByLabelText(label).textContent) - Date.now()) / 60_000)

describe('The server’s clock', () => {
    afterEach(() => {
        noteServerDate(new Date().toUTCString(), Date.now(), Date.now())
    })

    it('ignores the Date header’s rounding, and corrects a computer an hour slow', () => {
        const now = Date.now()
        noteServerDate(new Date(now).toUTCString(), now, now)
        expect(Math.abs(serverNow() - Date.now())).toBeLessThan(50)

        noteServerDate(new Date(now + 3_600_000).toUTCString(), now, now)
        expect(Math.round((serverNow() - Date.now()) / 60_000)).toBe(60)
    })

    it('counts server times from the server’s clock, and this browser’s own from its own', () => {
        const now = Date.now()
        noteServerDate(new Date(now + 3_600_000).toUTCString(), now, now)
        render(
            <>
                <ServerTime>
                    <Clock label='server' />
                </ServerTime>
                <Clock label='browser' />
            </>
        )
        expect(offsetOf('server')).toBe(60)
        expect(Math.abs(offsetOf('browser'))).toBe(0)
    })
})

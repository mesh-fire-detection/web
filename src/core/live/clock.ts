/*
 * One ticker for the whole site, so every age on screen moves together. It
 * runs only while something is listening.
 */
const listeners = new Set<() => void>()
const clock: { now: number; ticker: ReturnType<typeof setInterval> | undefined } = {
    now: Date.now(),
    ticker: undefined,
}

export function subscribeClock(listener: () => void): () => void {
    listeners.add(listener)
    if (clock.ticker === undefined) {
        clock.now = Date.now()
        clock.ticker = setInterval(() => {
            clock.now = Date.now()
            for (const notify of listeners) notify()
        }, 1000)
    }
    return () => {
        listeners.delete(listener)
        if (listeners.size > 0) return
        clearInterval(clock.ticker)
        clock.ticker = undefined
    }
}

/** How far this computer's clock is behind the server's, in ms; 0 until a response says. */
const server = { offset: 0 }

/** Differences smaller than this are the `Date` header's one-second rounding, not a wrong clock. */
const CLOCK_TOLERANCE_MS = 2000

/**
 * Learns the server's clock from a response's `Date` header, taking the
 * request's midpoint as the moment it was stamped. Ages of server data are
 * then measured against the server's clock, so a computer whose clock is off
 * does not show a node heard just now as heard an hour ago.
 */
export function noteServerDate(header: string | null, sentAt: number, receivedAt: number): void {
    if (header === null) return
    const stamped = Date.parse(header)
    if (Number.isNaN(stamped)) return
    // The header is rounded down to the second.
    const difference = stamped + 500 - (sentAt + receivedAt) / 2
    const next = Math.abs(difference) < CLOCK_TOLERANCE_MS ? 0 : Math.round(difference)
    if (next === server.offset) return
    server.offset = next
    for (const notify of listeners) notify()
}

/** The server's time now, as best this computer knows it. */
export function serverNow(): number {
    return Date.now() + server.offset
}

/** The offset itself, for a clock that adds it to a tick. */
export function serverOffset(): number {
    return server.offset
}

/** Per step, the time when the clock last entered a new step: shared, so ages agree. */
const steps = new Map<number, { readonly step: number; readonly now: number }>()

/**
 * The time at the last tick, changing only once per `stepMs`, so a page that
 * shows minutes re-renders a few times a minute rather than every second.
 */
export function clockNowEvery(stepMs: number): number {
    const step = Math.floor(clock.now / stepMs)
    const held = steps.get(stepMs)
    if (held?.step === step) return held.now
    steps.set(stepMs, { step, now: clock.now })
    return clock.now
}

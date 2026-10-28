import { useCallback, useEffect, useState } from 'react'

import { codeStepContent } from '@core/content/site/account/codeStep'

const copy = codeStepContent

/** How long before another code can be asked for. Each request spends an email. */
const RESEND_COOLDOWN_SECONDS = 30

/**
 * Where to go after signing in or joining. Only a path on this site: an
 * absolute URL or a protocol-relative `//host` in `next` would turn the page
 * into an open redirect.
 */
export const safeNext = (next: string | null): string =>
    next !== null && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
        ? next
        : '/account'

/** People paste codes from email with spaces in them. */
export const normaliseCode = (raw: string): string => raw.replaceAll(/\s/gu, '')

export const looksLikeEmail = (raw: string): boolean => /^[^\s@]+@[^\s@]+$/u.test(raw.trim())

/** Errors that belong to the code itself, shown on the field rather than the form. */
const CODE_ERRORS = ['INVALID_OTP', 'OTP_EXPIRED', 'TOO_MANY_ATTEMPTS', 'NOT_INVITED'] as const

export const codeErrorMessage = (error: string): string | undefined =>
    (CODE_ERRORS as readonly string[]).includes(error)
        ? copy.errors[error as (typeof CODE_ERRORS)[number]]
        : undefined

/** For the form as a whole: the server could not be reached, or said no for another reason. */
export const formErrorMessage = (error: string): string =>
    error === 'rate_limited' || error === 'unreachable' ? copy.errors[error] : copy.errors.fallback

/**
 * Seconds until another code may be requested, counting down to zero. Starts
 * running as soon as it is created, because the first code was just sent.
 */
export function useCooldown(): { readonly remaining: number; readonly restart: () => void } {
    const [until, setUntil] = useState(() => Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
    const [now, setNow] = useState(() => Date.now())
    const remaining = Math.max(0, Math.ceil((until - now) / 1000))

    useEffect(() => {
        if (remaining === 0) return
        const timer = window.setInterval(() => {
            setNow(Date.now())
        }, 1000)
        return () => {
            window.clearInterval(timer)
        }
    }, [remaining])

    const restart = useCallback(() => {
        const start = Date.now()
        setNow(start)
        setUntil(start + RESEND_COOLDOWN_SECONDS * 1000)
    }, [])

    return { remaining, restart }
}

import type { CodeStepContent } from '@core/content/types'

export const codeStepContent = {
    label: 'Code',
    limits: 'A code works once, for ten minutes, and allows three tries.',
    resend: 'Send a new code',
    resendIn: 'Send a new code in {seconds} s',
    resent: 'New code sent. The previous one no longer works.',
    changeEmail: 'Use a different email',
    invalidCode: 'The code is six digits.',
    invalidEmail: 'Enter a full email address.',
    errors: {
        INVALID_OTP: "That code doesn't match. Check it and try again.",
        OTP_EXPIRED: 'That code has expired. Send a new one.',
        TOO_MANY_ATTEMPTS: 'Too many tries with that code. Send a new one.',
        NOT_INVITED: 'This invitation is no longer open. Ask whoever invited you.',
        rate_limited: 'Too many requests. Wait a few minutes and try again.',
        unreachable: "Can't reach the server right now. Try again in a moment.",
        fallback: 'Something went wrong. Try again in a moment.',
    },
} as const satisfies CodeStepContent

import type { SignInContent } from '@core/content/types'

export const signInContent = {
    title: 'Sign in',
    email: {
        lede: "We'll email you a six-digit code.",
        label: 'Email',
        submit: 'Send code',
        invalid: 'Enter the email address your account uses.',
    },
    code: {
        lede: 'Enter the code we sent to {address}. It expires in ten minutes.',
        label: 'Code',
        submit: 'Sign in',
        resend: 'Send a new code',
        resent: 'New code sent.',
        changeEmail: 'Use a different email',
        noEmail:
            'No email? Check spam, or ask whoever invited you whether your account uses this address.',
        invalid: 'The code is six digits.',
    },
    errors: {
        INVALID_OTP: "That code doesn't match. Check it and try again.",
        OTP_EXPIRED: 'That code has expired. Send a new one.',
        TOO_MANY_ATTEMPTS: 'Too many tries with that code. Send a new one.',
        rate_limited: 'Too many requests. Wait a few minutes and try again.',
        unreachable: "Can't reach the server right now. Try again in a moment.",
        fallback: 'Something went wrong. Try again in a moment.',
    },
} as const satisfies SignInContent

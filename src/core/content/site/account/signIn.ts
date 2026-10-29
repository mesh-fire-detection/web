import type { SignInContent } from '@core/content/types'

export const signInContent = {
    title: 'Sign in',
    email: {
        lede: "We'll email you a six-digit code.",
        label: 'Email',
        submit: 'Send code',
    },
    code: {
        lede: 'If {address} can sign in, a code is on its way.',
        noEmail:
            'Nothing after a few minutes? Check spam, or ask whoever invited you which address they used.',
        submit: 'Sign in',
    },
    join: { prompt: 'No account?', link: 'Join' },
} as const satisfies SignInContent

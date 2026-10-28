import type { JoinContent } from '@core/content/types'

export const joinContent = {
    title: 'Join',
    lede: 'Members can sign in, keep their nodes and get project updates. Two ways in.',
    node: {
        title: "I've built a node",
        body: 'Joining with a node you built is on its way. Until then, connect it to check it works, and ask us for an invitation.',
        connect: 'Connect a Node',
        ask: 'Ask for an invitation',
    },
    invited: {
        title: 'I was invited',
        body: 'Use the address your invitation is for.',
        emailLabel: 'Email',
        nameLabel: 'Your name',
        nameInvalid: 'Enter your name.',
        updates:
            'Joining also signs you up for occasional project updates. You can stop them at any time.',
        submit: 'Send code',
    },
    code: {
        lede: 'If {address} is on our list, a code is on its way.',
        noEmail:
            'Nothing after a few minutes? Check spam, or ask whoever invited you which address they used.',
        submit: 'Join',
    },
    signIn: { prompt: 'Already a member?', link: 'Sign in' },
} as const satisfies JoinContent

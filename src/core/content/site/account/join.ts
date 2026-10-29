import type { JoinContent } from '@core/content/types'

export const joinContent = {
    title: 'Become a member',
    lede: 'Membership is for the people building the network. Members keep their nodes on an account and get occasional project updates.',
    noNodes: {
        title: 'Start by connecting your node',
        body: 'Connect a node you built. It stays in this browser, and nothing is sent anywhere, until you come back here and join.',
        connect: 'Connect a Node',
    },
    nodes: {
        title: 'Nodes from this browser',
        body: 'These are added to your account when you join.',
        unnamed: 'Unnamed node',
    },
    form: {
        title: 'Your details',
        emailLabel: 'Email',
        nameLabel: 'Your name',
        nameInvalid: 'Enter your name.',
        updates:
            'Joining also signs you up for occasional project updates. You can stop them at any time.',
        submit: 'Send code',
    },
    code: {
        lede: 'If {address} can join, a code is on its way.',
        noEmail: 'Nothing after a few minutes? Check spam, and check the address above.',
        submit: 'Join',
    },
    signIn: { prompt: 'Already a member?', link: 'Sign in' },
} as const satisfies JoinContent

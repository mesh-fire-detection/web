import type { MembershipContent } from '@core/content/types'

export const membershipContent = {
    connect: {
        title: 'Become a member',
        body: 'Your node is connected. Join to keep your nodes on an account and get occasional project updates. This browser remembers them until you do.',
        cta: 'Become a member',
        signIn: { prompt: 'Already a member?', link: 'Sign in' },
    },
    signedIn: {
        title: 'Your account',
        add: 'Add to my account',
        added: 'Added to your account.',
        allAdded: 'Every node here is on your account.',
        failed: "Couldn't add them right now. Try again in a moment.",
    },
    footer: {
        title: 'Become a member',
        body: 'This browser has connected a node. Join to keep it on an account and get project updates.',
        cta: 'Become a member',
    },
} as const satisfies MembershipContent

import type { AccountContent } from '@core/content/types'

export const accountContent = {
    title: 'Account',
    details: {
        name: 'Name',
        nameInvalid: 'Enter your name.',
        email: 'Email',
        emailFixed: 'You sign in with this address, so it cannot be changed here.',
        save: 'Save',
        saved: 'Saved.',
    },
    signOut: 'Sign out',
    nodes: {
        title: 'Your nodes',
        empty: 'No nodes yet. Connect one, then add it to your account from that page.',
        unnamed: 'Unnamed node',
        connect: 'Connect a Node',
    },
} as const satisfies AccountContent

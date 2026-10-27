import type { AccountContent } from '@core/content/types'

export const accountContent = {
    title: 'Account',
    labels: { name: 'Name', email: 'Email', role: 'Role' },
    roles: { admin: 'Admin', user: 'Member' },
    signOut: 'Sign out',
} as const satisfies AccountContent

import type { UpdatesContent } from '@core/content/types'

export const updatesContent = {
    footer: {
        title: 'Get updates',
        label: 'Email',
        submit: 'Subscribe',
        consent: 'Occasional project updates by email. Confirm by the link we send; stop any time.',
        sent: 'Check your inbox to confirm.',
    },
    confirm: {
        title: 'Confirm your updates',
        lede: 'Press the button to start receiving occasional project updates.',
        button: 'Confirm subscription',
        done: "You're subscribed. Thank you.",
        invalid: 'This link is invalid or has already been used.',
        missing: 'This page needs the link from your confirmation email.',
    },
    account: {
        title: 'Updates',
        on: 'You get occasional project updates by email.',
        off: "You don't get project updates.",
        turnOn: 'Send me occasional project updates by email.',
        turnOff: 'Stop updates',
    },
} as const satisfies UpdatesContent

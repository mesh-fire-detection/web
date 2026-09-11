import { SITE } from '@core/config/site'
import type { FooterContent } from '@core/content/types'

export const footerContent = {
    columns: [
        {
            title: 'Project',
            links: [
                { label: 'About', to: '/about' },
                { label: 'Goals', to: '/about#goals' },
                { label: 'Roadmap', to: '/about#roadmap' },
                { label: 'Open Problems', to: '/open-problems' },
            ],
        },
        {
            title: 'Build',
            links: [
                { label: 'Bill of Materials', to: '/build#bom' },
                { label: 'Node Types', to: '/build#node-types' },
                { label: 'Enclosures (STL)', to: '/build#enclosures' },
                { label: 'Firmware & Config', to: '/build#firmware' },
                { label: 'Assembly Guide', to: '/build#assembly' },
            ],
        },
        {
            title: 'Network',
            links: [
                { label: 'Live Map', to: '/map' },
                { label: 'Coverage Calculator', to: '/coverage' },
                { label: 'Node Status', to: '/map#nodes' },
                { label: 'Deployment Log', to: '/map#log' },
                { label: 'False Positives', to: '/open-problems#false-positives' },
            ],
        },
        {
            title: 'Contribute',
            links: [
                { label: 'GitHub', to: SITE.github },
                { label: 'Discord', to: SITE.discord },
                { label: 'Report a Node', to: `${SITE.github}/issues/new` },
                { label: 'Contact', to: SITE.contact },
            ],
        },
    ],
} as const satisfies FooterContent

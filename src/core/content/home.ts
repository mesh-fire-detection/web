import type { HomeContent } from '@core/content/types'

export const homeContent = {
    hero: {
        eyebrow: 'Open hardware · LoRa mesh · US915',
        titleBefore: 'A camera site costs $15,000.',
        titleAfter: 'Our node costs $70.',
        lede: 'Wildfire detection fails because coverage is expensive. Make each unit cheap enough to lose and you can cover the ground that matters. Here is the bill of materials, the network, and everything we have not solved.',
        primaryCta: 'Build a Node',
        secondaryCta: 'See the network',
    },
    network: {
        eyebrow: 'The network',
        title: 'Fourteen nodes, and we show you the dead ones',
        lede: 'Node type, last heartbeat, battery, and the SNR of every link. When a node dies it stays on the map, coloured red, until someone walks up the hill and fixes it.',
        mapCta: 'Full map',
        hardwareCost: '$1,204',
    },
    baseline: {
        eyebrow: 'The problem, quantified',
        title: 'We do not have a detection-time baseline yet.',
        paragraphs: [
            "The project's first goal is to reduce wildfire detection time. Reduce it from what? We refuse to put an unbacked number on this page — a specific claim you cannot defend is the fastest way to lose the agency people this network needs.",
            'So the honest state is: unmeasured. A public records request for one Washington fire district is drafted and not yet filed. When the median comes back, it goes here, with the raw records next to it.',
        ],
        cta: 'Read the open problem',
        publishLabel: 'What we will publish',
        rows: [
            { label: 'District', value: 'One named Washington district' },
            { label: 'Quantity', value: 'Ignition to first dispatched unit' },
            { label: 'Window', value: 'Five years of incidents' },
            { label: 'Method', value: 'Published alongside the raw records' },
            { label: 'Current value', value: 'unmeasured', tone: 'warn' },
        ],
    },
    nodeTypes: {
        eyebrow: 'Four node types',
        title: 'One of them carries the mesh. The other three hang off it.',
        lede: 'A branch starts at a Cellular node and runs as a chain of Base nodes. Sensor and Vision nodes attach where they are useful, not where the topology needs them.',
    },
    problems: {
        eyebrow: 'Unsolved',
        title: 'The parts we have not figured out',
        lede: 'Hiding unknowns gets you spectators. Publishing them gets you collaborators. Each of these has constraints, what has been tried, and what would close it.',
        allCta: 'All',
    },
    closing: {
        title: 'Ten minutes from this page to a filled cart.',
        lede: 'Every part is linked to a supplier with a current price. The enclosure STLs and the Meshtastic config presets are hosted here, not behind a form. If you have to ask a question to build a node, that is a bug in this site.',
        primaryCta: 'Bill of materials',
        secondaryCta: 'Would it work where I live?',
    },
} as const satisfies HomeContent

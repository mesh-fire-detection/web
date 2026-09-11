export const SITE = {
    name: 'Mesh Fire Detection',
    short: 'MFD',
    tagline: 'A wildfire detection network you can afford to lose nodes from.',
    github: 'https://github.com/mesh-fire-detection',
    discussions: 'https://github.com/orgs/mesh-fire-detection/discussions/',
    discord: 'https://discord.gg/mesh-fire-detection',
    contact: 'mailto:contact@meshfiredetection.org',
    licenses: {
        hardware: { name: 'CERN-OHL-S v2', href: 'https://cern-ohl.web.cern.ch/' },
        firmware: { name: 'MIT', href: 'https://opensource.org/license/mit' },
    },
    /** Shown in the footer on every page. A fire district's lawyer looks for this first. */
    disclaimer: 'Not an emergency service.',
} as const

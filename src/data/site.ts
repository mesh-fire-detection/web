export const SITE = {
  name: 'Mesh Fire Detection',
  short: 'MFD',
  tagline: 'A wildfire detection network you can afford to lose nodes from.',
  github: 'https://github.com/mesh-fire-detection',
  discord: 'https://discord.gg/mesh-fire-detection',
  contact: 'mailto:hello@meshfiredetection.org',
  licenses: {
    hardware: { name: 'CERN-OHL-S v2', href: 'https://cern-ohl.web.cern.ch/' },
    firmware: { name: 'MIT', href: 'https://opensource.org/license/mit' },
  },
  /** Shown in the footer on every page. A fire district's lawyer looks for this first. */
  disclaimer: 'Not an emergency service.',
} as const

export interface NavItem {
  label: string
  to: string
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Map', to: '/map' },
  { label: 'Build', to: '/build' },
  { label: 'Coverage', to: '/coverage' },
  { label: 'Open Problems', to: '/open-problems' },
  { label: 'About', to: '/about' },
]

export interface FooterColumn {
  title: string
  links: readonly NavItem[]
}

export const FOOTER_NAV: readonly FooterColumn[] = [
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
]

import type { TitledDetail } from '@core/content/types'

export const placement = [
    {
        title: 'Get the antenna high, then get it vertical',
        detail: 'Height buys more link budget than any component on the bill of materials. A Base node at 8 m outperforms the same node at 2 m by roughly 6 dB of horizon alone, and costs a pipe.',
    },
    {
        title: 'Ridge to ridge, not ridge to valley',
        detail: 'The chain wants line of sight along the terrain, not across it. A hop that crosses a drainage at right angles is a hop that fails in the first wet winter.',
    },
    {
        title: 'Point Vision nodes across a drainage',
        detail: 'A camera viewshed is a propagation viewshed with different constants. Site them where they see the valley floor, not where they see the next ridge.',
    },
    {
        title: 'Never make one node critical',
        detail: 'If a node has exactly one parent, its failure orphans everything behind it. The map shows exactly this — Mailbox Bowl is unreachable because Mailbox Spur is down.',
    },
] as const satisfies readonly TitledDetail[]

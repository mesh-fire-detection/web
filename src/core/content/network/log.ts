import type { MapContent } from '@core/content/types'

export const mapContent = {
    title: 'Live map',
    eyebrow: 'The network',
    lede: 'Every node in the network, including the ones that are not working. Click a node for its link budget, battery and last heartbeat.',
    nodes: {
        eyebrow: 'Node status',
        title: 'Every node, ordered from the branch head outward',
        lede: 'Three of fourteen are down, and two of those never reported at all. Leaving failures visible is the point — a network that shows you only its working nodes is telling you nothing.',
    },
    log: {
        eyebrow: 'Deployment log',
        title: 'What happened, in the order it happened',
        lede: 'Written as a log because that is the shape the real one takes. Until the first node is in the ground, these entries describe the planned branch.',
        older: 'Older entries are in the repository.',
        entries: [
            {
                date: '2026-08-21',
                event: 'Prospect East went dark. Battery protection cutout suspected — the cell was at 4% on its last packet.',
                kind: 'bad',
            },
            {
                date: '2026-07-05',
                event: 'Mailbox Spur and Mailbox Bowl installed. Neither has ever reported. Physical recovery scheduled.',
                kind: 'bad',
            },
            {
                date: '2026-06-14',
                event: [
                    'Christmas Ridge and Christmas Saddle brought online. The ',
                    { km: 2.5 },
                    ' hop from East Peak closed at 4.9 dB SNR.',
                ],
                kind: 'good',
            },
            {
                date: '2026-05-24',
                event: [
                    'East Peak Base and its Vision node installed at ',
                    { m: 943 },
                    '. Best link budget in the network.',
                ],
                kind: 'good',
            },
            {
                date: '2026-05-02',
                event: 'Grand Prospect installed. Solar panel sited before leaf-out; it has been shaded ever since.',
                kind: 'warn',
            },
            {
                date: '2026-04-12',
                event: 'Branch head at Truck Road Gate, first Base node at Cedar Butte. Network exists.',
                kind: 'good',
            },
        ],
    },
    noBasemap: {
        title: 'No basemap, on purpose',
        body: 'The map renders node geometry on a blank canvas — no tile requests, no API key, no bill. That is the same instinct that produces a $70 node. Point VITE_BASEMAP_STYLE at a Protomaps or MapTiler style and terrain appears underneath, unchanged otherwise.',
        env: 'VITE_BASEMAP_STYLE',
    },
} as const satisfies MapContent

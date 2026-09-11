import { useState } from 'react'

import { Callout } from '@/components/common/Callout'
import { SampleDataBanner } from '@/components/common/SampleDataBanner'
import { SectionHead } from '@/components/common/SectionHead'
import { LazyNetworkMap } from '@/components/network/LazyNetworkMap'
import { MapLegend } from '@/components/network/MapLegend'
import { NodePanel } from '@/components/network/NodePanel'
import { NodeTable } from '@/components/network/NodeTable'
import type { MeshNode } from '@/data/network'
import { LINKS, NODES, countByStatus, linkQuality } from '@/data/network'
import { Page } from '@/layout/Page'
import { decimal } from '@/lib/format'
import { HAS_BASEMAP } from '@/lib/mapStyle'
import { Box, Grid, Heading, Metric, Row, Section, Stack, Text } from '@/ui'

const DEPLOYMENT_LOG = [
    {
        date: '2026-08-21',
        event: 'Prospect East went dark. Battery protection cutout suspected — the cell was at 4% on its last packet.',
        kind: 'bad' as const,
    },
    {
        date: '2026-07-05',
        event: 'Mailbox Spur and Mailbox Bowl installed. Neither has ever reported. Physical recovery scheduled.',
        kind: 'bad' as const,
    },
    {
        date: '2026-06-14',
        event: 'Christmas Ridge and Christmas Saddle brought online. The 2.5 km hop from East Peak closed at 4.9 dB SNR.',
        kind: 'good' as const,
    },
    {
        date: '2026-05-24',
        event: 'East Peak Base and its Vision node installed at 943 m. Best link budget in the network.',
        kind: 'good' as const,
    },
    {
        date: '2026-05-02',
        event: 'Grand Prospect installed. Solar panel sited before leaf-out; it has been shaded ever since.',
        kind: 'warn' as const,
    },
    {
        date: '2026-04-12',
        event: 'Branch head at Truck Road Gate, first Base node at Cedar Butte. Network exists.',
        kind: 'good' as const,
    },
]

export function MapPage() {
    const [selected, setSelected] = useState<MeshNode | null>(null)
    const counts = countByStatus()

    const marginalLinks = LINKS.filter((link) => linkQuality(link.snr) !== 'good').length
    const longestHop = Math.max(...LINKS.map((link) => link.distanceKm))
    const totalHeight = NODES.reduce((sum, node) => sum + node.antennaHeightM, 0)

    return (
        <Page
            title='Live map'
            eyebrow='The network'
            lede='Every node in the network, including the ones that are not working. Click a node for its link budget, battery and last heartbeat.'
            aside={<SampleDataBanner />}
        >
            <Section space='sm'>
                <Stack gap={6}>
                    <Box tone='transparent' border={false} padding={0} className='map_shell'>
                        <MapLegend />
                        <LazyNetworkMap
                            selectedId={selected?.id ?? null}
                            onSelect={setSelected}
                            height={560}
                        />
                        {selected ? (
                            <NodePanel
                                node={selected}
                                onClose={() => {
                                    setSelected(null)
                                }}
                            />
                        ) : null}
                    </Box>

                    {HAS_BASEMAP ? null : (
                        <Callout title='No basemap, on purpose' tone='fire' icon='map'>
                            The map renders node geometry on a blank canvas — no tile requests, no
                            API key, no bill. That is the same instinct that produces a $70 node.
                            Point{' '}
                            <Text as='span' mono size='inherit' tone='fire'>
                                VITE_BASEMAP_STYLE
                            </Text>{' '}
                            at a Protomaps or MapTiler style and terrain appears underneath,
                            unchanged otherwise.
                        </Callout>
                    )}

                    <Grid columns={5} minColumnWidth={150} gap={5}>
                        <Metric label='Online' value={counts.online} tone='live' size='lg' />
                        <Metric label='Degraded' value={counts.degraded} tone='warn' size='lg' />
                        <Metric label='Offline' value={counts.offline} tone='dead' size='lg' />
                        <Metric
                            label='Marginal links'
                            value={marginalLinks}
                            tone={marginalLinks > 0 ? 'warn' : 'live'}
                            size='lg'
                            hint={`of ${LINKS.length} total`}
                        />
                        <Metric
                            label='Longest hop'
                            value={`${decimal(longestHop)} km`}
                            size='lg'
                            hint={`${totalHeight} m of mast total`}
                        />
                    </Grid>
                </Stack>
            </Section>

            <Section space='md' tone='raised' bordered id='nodes'>
                <Stack gap={5}>
                    <SectionHead
                        eyebrow='Node status'
                        title='Every node, ordered from the branch head outward'
                        lede='Three of fourteen are down, and two of those never reported at all. Leaving failures visible is the point — a network that shows you only its working nodes is telling you nothing.'
                    />
                    <NodeTable selectedId={selected?.id ?? null} onSelect={setSelected} />
                </Stack>
            </Section>

            <Section space='md' bordered id='log'>
                <Stack gap={5}>
                    <SectionHead
                        eyebrow='Deployment log'
                        title='What happened, in the order it happened'
                        lede='Written as a log because that is the shape the real one takes. Until the first node is in the ground, these entries describe the planned branch.'
                    />
                    <Stack gap={0}>
                        {DEPLOYMENT_LOG.map((entry) => (
                            <Row
                                key={entry.date}
                                gap={5}
                                align='start'
                                wrap={false}
                                className='log_row'
                            >
                                <Text as='span' size='xs' mono tone='faint' className='log_date'>
                                    {entry.date}
                                </Text>
                                <Text
                                    size='sm'
                                    tone={
                                        entry.kind === 'bad'
                                            ? 'dead'
                                            : entry.kind === 'warn'
                                              ? 'warn'
                                              : 'muted'
                                    }
                                    measure={90}
                                >
                                    {entry.event}
                                </Text>
                            </Row>
                        ))}
                    </Stack>
                    <Heading level={3} size='sm' tone='faint'>
                        Older entries are in the repository.
                    </Heading>
                </Stack>
            </Section>
        </Page>
    )
}

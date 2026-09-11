import { useState } from 'react'

import { Page } from '@components/layout/Page'
import { LazyNetworkMap } from '@components/network/LazyNetworkMap'
import { MapLegend } from '@components/network/MapLegend'
import { NodePanel } from '@components/network/NodePanel'
import { NodeTable } from '@components/network/NodeTable'
import { SectionHead } from '@components/shared/page/SectionHead'
import { Box, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Metric } from '@components/shared/widgets/Badge'
import { Callout } from '@components/shared/widgets/Callout'
import { SampleDataBanner } from '@components/shared/widgets/SampleDataBanner'
import { mapContent } from '@core/content/network/log'
import type { MeshNode } from '@core/content/network/network'
import { LINKS, NODES, countByStatus, linkQuality } from '@core/content/network/network'
import { decimal } from '@core/format/format'
import { HAS_BASEMAP } from '@core/map/mapStyle'

export function MapPage() {
    const [selected, setSelected] = useState<MeshNode | null>(null)
    const counts = countByStatus()

    const marginalLinks = LINKS.filter((link) => linkQuality(link.snr) !== 'good').length
    const longestHop = Math.max(...LINKS.map((link) => link.distanceKm))
    const totalHeight = NODES.reduce((sum, node) => sum + node.antennaHeightM, 0)

    return (
        <Page
            title={mapContent.title}
            eyebrow={mapContent.eyebrow}
            lede={mapContent.lede}
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
                        <Callout title={mapContent.noBasemap.title} tone='fire' icon='map'>
                            The map renders node geometry on a blank canvas — no tile requests, no
                            API key, no bill. That is the same instinct that produces a $70 node.
                            Point{' '}
                            <Text as='span' mono size='inherit' tone='fire'>
                                {mapContent.noBasemap.env}
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
                        eyebrow={mapContent.nodes.eyebrow}
                        title={mapContent.nodes.title}
                        lede={mapContent.nodes.lede}
                    />
                    <NodeTable selectedId={selected?.id ?? null} onSelect={setSelected} />
                </Stack>
            </Section>

            <Section space='md' bordered id='log'>
                <Stack gap={5}>
                    <SectionHead
                        eyebrow={mapContent.log.eyebrow}
                        title={mapContent.log.title}
                        lede={mapContent.log.lede}
                    />
                    <Stack gap={0}>
                        {mapContent.log.entries.map((entry) => (
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
                        {mapContent.log.older}
                    </Heading>
                </Stack>
            </Section>
        </Page>
    )
}

import { useState } from 'react'

import { NodeTypeGrid } from '@components/build/NodeTypeGrid'
import { Page } from '@components/layout/Page'
import { LazyNetworkMap } from '@components/network/LazyNetworkMap'
import { MapLegend } from '@components/network/MapLegend'
import { NodePanel } from '@components/network/NodePanel'
import { SectionHead } from '@components/shared/page/SectionHead'
import { Box, Container, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Eyebrow, Heading } from '@components/shared/typography/Heading'
import { Break, Text, Value } from '@components/shared/typography/Text'
import { ButtonLink, TextLink } from '@components/shared/widgets/Action'
import { Metric } from '@components/shared/widgets/Badge'
import { CostComparison } from '@components/shared/widgets/CostComparison'
import { Icon } from '@components/shared/widgets/Icon'
import { SampleDataBanner } from '@components/shared/widgets/SampleDataBanner'
import { homeContent } from '@core/content/home'
import type { MeshNode } from '@core/content/network/network'
import { countByStatus } from '@core/content/network/network'
import { PROBLEMS } from '@core/content/problems/problems'
import { plural } from '@core/format/format'

export function HomePage() {
    const [selected, setSelected] = useState<MeshNode | null>(null)
    const counts = countByStatus()
    const copy = homeContent

    return (
        <Page headed={false}>
            <Section space='lg' grid>
                <Stack gap={8}>
                    <Stack gap={5} align='center'>
                        <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
                        <Heading level={1} size='5xl' align='center' measure={20}>
                            {copy.hero.titleBefore}
                            <Break />
                            {copy.hero.titleAfter}
                        </Heading>
                        <Text size='lg' tone='muted' align='center' measure={68}>
                            {copy.hero.lede}
                        </Text>
                        <Row gap={3} justify='center'>
                            <ButtonLink
                                to='/build'
                                size='lg'
                                iconAfter={<Icon name='arrow-right' size={16} />}
                            >
                                {copy.hero.primaryCta}
                            </ButtonLink>
                            <ButtonLink to='/map' size='lg' variant='secondary'>
                                {copy.hero.secondaryCta}
                            </ButtonLink>
                        </Row>
                    </Stack>

                    <CostComparison />
                </Stack>
            </Section>

            <Section space='md' tone='raised' bordered id='network'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={copy.network.eyebrow}
                        title={copy.network.title}
                        lede={copy.network.lede}
                        action={
                            <ButtonLink
                                to='/map'
                                variant='secondary'
                                size='sm'
                                iconAfter={<Icon name='arrow-right' size={14} />}
                            >
                                {copy.network.mapCta}
                            </ButtonLink>
                        }
                    />

                    <SampleDataBanner />

                    <Box tone='transparent' border={false} padding={0} className='map_shell'>
                        <MapLegend />
                        <LazyNetworkMap
                            selectedId={selected?.id ?? null}
                            onSelect={setSelected}
                            height={460}
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

                    <Grid columns={4} minColumnWidth={160} gap={5}>
                        <Metric label='Online' value={counts.online} tone='live' size='lg' />
                        <Metric label='Degraded' value={counts.degraded} tone='warn' size='lg' />
                        <Metric label='Offline' value={counts.offline} tone='dead' size='lg' />
                        <Metric
                            label='Hardware cost'
                            value={copy.network.hardwareCost}
                            size='lg'
                            hint='all fourteen nodes'
                        />
                    </Grid>
                </Stack>
            </Section>

            <Section space='md' bordered>
                <Grid columns={2} minColumnWidth={320} gap={7} align='start'>
                    <Stack gap={4}>
                        <Eyebrow tone='warn'>{copy.baseline.eyebrow}</Eyebrow>
                        <Heading level={2} size='2xl' measure={26}>
                            {copy.baseline.title}
                        </Heading>
                        {copy.baseline.paragraphs.map((paragraph) => (
                            <Text key={paragraph} tone='muted' measure={70}>
                                {paragraph}
                            </Text>
                        ))}
                        <Row gap={3}>
                            <ButtonLink
                                to='/open-problems#detection-baseline'
                                variant='secondary'
                                size='sm'
                            >
                                {copy.baseline.cta}
                            </ButtonLink>
                        </Row>
                    </Stack>

                    <Box tone='surface' padding={6} radius='md'>
                        <Stack gap={5}>
                            <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                                {copy.baseline.publishLabel}
                            </Text>
                            <Stack gap={4}>
                                {copy.baseline.rows.map((row) => (
                                    <BaselineRow
                                        key={row.label}
                                        label={row.label}
                                        value={row.value}
                                        tone={'tone' in row ? row.tone : undefined}
                                    />
                                ))}
                            </Stack>
                        </Stack>
                    </Box>
                </Grid>
            </Section>

            <Section space='md' tone='raised' bordered>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={copy.nodeTypes.eyebrow}
                        title={copy.nodeTypes.title}
                        lede={copy.nodeTypes.lede}
                    />
                    <NodeTypeGrid />
                </Stack>
            </Section>

            <Section space='md' bordered>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={copy.problems.eyebrow}
                        title={copy.problems.title}
                        lede={copy.problems.lede}
                        action={
                            <ButtonLink
                                to='/open-problems'
                                variant='secondary'
                                size='sm'
                                iconAfter={<Icon name='arrow-right' size={14} />}
                            >
                                {copy.problems.allCta} {PROBLEMS.length} problems
                            </ButtonLink>
                        }
                    />

                    <Grid columns={3} minColumnWidth={260} gap={4}>
                        {PROBLEMS.map((problem) => (
                            <Box
                                key={problem.slug}
                                tone='surface'
                                padding={5}
                                radius='md'
                                className='problem_teaser'
                                grow
                            >
                                <Stack gap={3} grow>
                                    <Text as='span' tone='fire' className='problem_teaser_icon'>
                                        <Icon name='problem' size={18} />
                                    </Text>
                                    <Heading level={3} size='sm'>
                                        {problem.title}
                                    </Heading>
                                    <Text size='sm' tone='muted' className='grow'>
                                        {problem.question}
                                    </Text>
                                    <TextLink
                                        to={`/open-problems#${problem.slug}`}
                                        tone='fire'
                                        size='xs'
                                    >
                                        {problem.tried.length}{' '}
                                        {plural(problem.tried.length, 'approach', 'approaches')}{' '}
                                        tried
                                    </TextLink>
                                </Stack>
                            </Box>
                        ))}
                    </Grid>
                </Stack>
            </Section>

            <Section space='md' tone='sunken' bordered>
                <Container width='narrow'>
                    <Stack gap={5} align='center'>
                        <Heading level={2} size='2xl' align='center' measure={28}>
                            {copy.closing.title}
                        </Heading>
                        <Text tone='muted' align='center' measure={66}>
                            {copy.closing.lede}
                        </Text>
                        <Row gap={3} justify='center'>
                            <ButtonLink
                                to='/build'
                                size='lg'
                                iconAfter={<Icon name='arrow-right' size={16} />}
                            >
                                {copy.closing.primaryCta}
                            </ButtonLink>
                            <ButtonLink to='/coverage' size='lg' variant='secondary'>
                                {copy.closing.secondaryCta}
                            </ButtonLink>
                        </Row>
                    </Stack>
                </Container>
            </Section>
        </Page>
    )
}

function BaselineRow({
    label,
    value,
    tone = 'default',
}: {
    label: string
    value: string
    tone?: 'default' | 'warn' | undefined
}) {
    return (
        <Row justify='between' gap={4} align='start' className='baseline_row'>
            <Text as='span' size='xs' mono uppercase tone='faint' weight={600}>
                {label}
            </Text>
            <Value tone={tone} size='sm'>
                {value}
            </Value>
        </Row>
    )
}

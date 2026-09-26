import { useUnitSystem } from '@components/app/UnitsProvider'
import { AssemblySteps } from '@components/build/AssemblySteps'
import { BomTable } from '@components/build/BomTable'
import { DownloadList } from '@components/build/DownloadList'
import { NodeTypeGrid } from '@components/build/NodeTypeGrid'
import { Page } from '@components/layout/Page'
import { DescriptionItem, DescriptionList, List, ListItem } from '@components/shared/page/List'
import { SectionHead } from '@components/shared/page/SectionHead'
import { Box, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { ButtonAnchor, ButtonLink } from '@components/shared/widgets/Action'
import { Metric } from '@components/shared/widgets/Badge'
import { Callout } from '@components/shared/widgets/Callout'
import { Icon } from '@components/shared/widgets/Icon'
import { SITE } from '@core/config/site'
import { buildContent } from '@core/content/build/content'
import { formatCopy } from '@core/format/units'
import { PRESETS } from '@core/map/linkBudget'

export function BuildPage() {
    const { system } = useUnitSystem()
    return (
        <Page
            title={buildContent.title}
            eyebrow={buildContent.eyebrow}
            lede={buildContent.lede}
            aside={
                <Row gap={3}>
                    <ButtonLink
                        to='#bom'
                        size='md'
                        iconAfter={<Icon name='arrow-right' size={14} />}
                    >
                        {buildContent.jumpCta}
                    </ButtonLink>
                    <ButtonAnchor
                        href={SITE.github}
                        size='md'
                        iconBefore={<Icon name='github' size={16} />}
                    >
                        {buildContent.sourceCta}
                    </ButtonAnchor>
                </Row>
            }
        >
            <Section space='md' id='node-types'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={buildContent.nodeTypes.eyebrow}
                        title={buildContent.nodeTypes.title}
                        lede={buildContent.nodeTypes.lede}
                    />
                    <NodeTypeGrid />
                </Stack>
            </Section>

            <Section space='md' tone='raised' bordered id='bom'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={buildContent.bom.eyebrow}
                        title={buildContent.bom.title}
                        lede={buildContent.bom.lede}
                    />
                    <BomTable />

                    <Callout title={buildContent.bom.shippingTitle} tone='fire'>
                        {buildContent.bom.shippingBody}
                    </Callout>

                    <Callout title={buildContent.bom.substitutionTitle} tone='warn'>
                        {buildContent.bom.substitutionBody}
                    </Callout>
                </Stack>
            </Section>

            <Section space='md' bordered id='enclosures'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={buildContent.enclosures.eyebrow}
                        title={buildContent.enclosures.title}
                        lede={buildContent.enclosures.lede}
                    />
                    <DownloadList kind='stl' />
                    <Text size='sm' tone='warn' measure={86}>
                        {buildContent.enclosures.unpublished}
                    </Text>

                    <Grid columns={2} minColumnWidth={300} gap={6}>
                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    {buildContent.enclosures.printTitle}
                                </Heading>
                                <DescriptionList columns={1}>
                                    {buildContent.enclosures.print.map((item) => (
                                        <DescriptionItem key={item.term} term={item.term}>
                                            {item.value}
                                        </DescriptionItem>
                                    ))}
                                </DescriptionList>
                            </Stack>
                        </Box>

                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    {buildContent.enclosures.ipTitle}
                                </Heading>
                                <Text size='sm' tone='muted'>
                                    {buildContent.enclosures.ipBody}
                                </Text>
                                <Text size='sm' tone='warn'>
                                    {buildContent.enclosures.ipWarn}
                                </Text>
                            </Stack>
                        </Box>
                    </Grid>
                </Stack>
            </Section>

            <Section space='md' tone='raised' bordered id='firmware'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={buildContent.firmware.eyebrow}
                        title={buildContent.firmware.title}
                        lede={buildContent.firmware.lede}
                    />
                    <DownloadList kind='json' />

                    <Box tone='surface' padding={5} radius='md'>
                        <Stack gap={4}>
                            <Heading level={3} size='sm'>
                                {buildContent.firmware.presetsTitle}
                            </Heading>
                            <Grid columns={4} minColumnWidth={180} gap={5}>
                                {PRESETS.map((preset) => (
                                    <Stack key={preset.id} gap={2}>
                                        <Metric
                                            label={preset.label}
                                            value={`${preset.sensitivityDbm} dBm`}
                                            size='sm'
                                            hint='sensitivity'
                                        />
                                        <Text size='2xs' mono tone='faint'>
                                            SF{preset.spreadingFactor} · {preset.bandwidthKHz} kHz ·{' '}
                                            {preset.airtimeMs} ms airtime
                                        </Text>
                                    </Stack>
                                ))}
                            </Grid>
                            <Text size='sm' tone='muted'>
                                {buildContent.firmware.presetsNote}
                            </Text>
                        </Stack>
                    </Box>
                </Stack>
            </Section>

            <Section space='md' bordered id='particulate-sensor'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={buildContent.rak12039.eyebrow}
                        title={buildContent.rak12039.title}
                        lede={buildContent.rak12039.lede}
                    />

                    <Grid columns={2} minColumnWidth={300} gap={6}>
                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    {buildContent.rak12039.measurementsTitle}
                                </Heading>
                                <DescriptionList columns={1}>
                                    {buildContent.rak12039.measurements.map((item) => (
                                        <DescriptionItem key={item.title} term={item.title}>
                                            {formatCopy(item.detail, system)}
                                        </DescriptionItem>
                                    ))}
                                </DescriptionList>
                            </Stack>
                        </Box>

                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    {buildContent.rak12039.requirementsTitle}
                                </Heading>
                                <Stack gap={3}>
                                    {buildContent.rak12039.requirements.map((item) => (
                                        <Stack key={item.title} gap={1}>
                                            <Text size='sm' weight={600}>
                                                {item.title}
                                            </Text>
                                            <Text size='sm' tone='muted'>
                                                {formatCopy(item.detail, system)}
                                            </Text>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                        </Box>
                    </Grid>

                    <Callout title={buildContent.rak12039.firmwareTitle} tone='warn'>
                        {buildContent.rak12039.firmwareBody}
                    </Callout>

                    <Grid columns={2} minColumnWidth={300} gap={6}>
                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    {buildContent.rak12039.questionsTitle}
                                </Heading>
                                <List marker='dot' gap={3}>
                                    {buildContent.rak12039.questions.map((question) => (
                                        <ListItem key={question} size='sm'>
                                            {question}
                                        </ListItem>
                                    ))}
                                </List>
                            </Stack>
                        </Box>

                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    {buildContent.rak12039.readyTitle}
                                </Heading>
                                <List marker='dot' gap={3}>
                                    {buildContent.rak12039.ready.map((item) => (
                                        <ListItem key={item} size='sm'>
                                            {item}
                                        </ListItem>
                                    ))}
                                </List>
                            </Stack>
                        </Box>
                    </Grid>
                </Stack>
            </Section>

            <Section space='md' bordered id='assembly'>
                <Grid columns={2} minColumnWidth={320} gap={7} align='start'>
                    <Stack gap={5}>
                        <SectionHead
                            eyebrow={buildContent.assembly.eyebrow}
                            title={buildContent.assembly.title}
                            size='lg'
                        />
                        <AssemblySteps />
                    </Stack>

                    <Stack gap={5}>
                        <SectionHead
                            eyebrow={buildContent.placement.eyebrow}
                            title={buildContent.placement.title}
                            size='lg'
                        />
                        <Stack gap={4}>
                            {buildContent.placement.items.map((item) => (
                                <Box key={item.title} tone='surface' padding={5} radius='sm'>
                                    <Stack gap={2}>
                                        <Heading level={3} size='sm'>
                                            {item.title}
                                        </Heading>
                                        <Text size='sm' tone='muted'>
                                            {formatCopy(item.detail, system)}
                                        </Text>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                        <ButtonLink
                            to='/coverage'
                            variant='secondary'
                            iconAfter={<Icon name='arrow-right' size={14} />}
                        >
                            {buildContent.placement.coverageCta}
                        </ButtonLink>
                    </Stack>
                </Grid>
            </Section>

            <Section space='md' tone='sunken' bordered>
                <Stack gap={5}>
                    <SectionHead
                        eyebrow={buildContent.before.eyebrow}
                        title={buildContent.before.title}
                    />
                    <List marker='number' gap={4}>
                        {buildContent.before.items.map((item) => (
                            <ListItem key={item.lead}>
                                <Text as='span' weight={600}>
                                    {item.lead}
                                </Text>{' '}
                                {item.body}
                            </ListItem>
                        ))}
                    </List>
                </Stack>
            </Section>
        </Page>
    )
}

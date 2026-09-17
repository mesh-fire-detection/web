import { Page } from '@components/layout/Page'
import { List, ListItem } from '@components/shared/page/List'
import { SectionHead } from '@components/shared/page/SectionHead'
import { Box, Container, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { ButtonAnchor, ButtonLink, TextLink } from '@components/shared/widgets/Action'
import { Badge, Metric } from '@components/shared/widgets/Badge'
import { Icon } from '@components/shared/widgets/Icon'
import { SITE } from '@core/config/site'
import { nodeCost } from '@core/content/build/bom'
import { NODE_TYPES } from '@core/content/network/network'
import { aboutContent } from '@core/content/site/about'
import { money } from '@core/format/format'

export function AboutPage() {
    const copy = aboutContent
    const baseCost = money(nodeCost('base'))
    const fleetCost = NODE_TYPES.reduce((sum, spec) => sum + nodeCost(spec.type), 0)

    return (
        <Page title={copy.title} eyebrow={copy.eyebrow} lede={copy.lede}>
            <Section space='md' id='goals'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={copy.goals.eyebrow}
                        title={copy.goals.title}
                        lede={copy.goals.lede}
                    />

                    <Stack gap={4}>
                        {copy.goals.items.map((goal) => (
                            <Box key={goal.n} tone='surface' padding={5} radius='md'>
                                <Row gap={5} align='start' wrap={false}>
                                    <Text
                                        as='span'
                                        size='lg'
                                        mono
                                        weight={700}
                                        tone='fire'
                                        className='goal_num'
                                    >
                                        {goal.n}
                                    </Text>
                                    <Stack gap={2} minWidth0>
                                        <Row justify='between' gap={3}>
                                            <Heading level={3} size='md'>
                                                {goal.title}
                                            </Heading>
                                            <Badge kind={goal.kind}>{goal.status}</Badge>
                                        </Row>
                                        <Text size='sm' tone='muted' measure={86}>
                                            {goal.detail.split('{baseCost}').join(baseCost)}
                                        </Text>
                                    </Stack>
                                </Row>
                            </Box>
                        ))}
                    </Stack>
                </Stack>
            </Section>

            <Section space='md' tone='raised' bordered>
                <Grid columns={2} minColumnWidth={320} gap={7} align='start'>
                    <Stack gap={4}>
                        <SectionHead
                            eyebrow={copy.audience.eyebrow}
                            title={copy.audience.title}
                            size='lg'
                        />
                        {copy.audience.paragraphs.map((paragraph) => (
                            <Text key={paragraph} tone='muted' measure={72}>
                                {paragraph}
                            </Text>
                        ))}
                    </Stack>

                    <Box tone='surface' padding={6} radius='md'>
                        <Stack gap={5}>
                            <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                                {copy.audience.fleetLabel}
                            </Text>
                            <Grid columns={2} gap={5}>
                                {NODE_TYPES.map((spec) => (
                                    <Metric
                                        key={spec.type}
                                        label={spec.name}
                                        value={money(nodeCost(spec.type))}
                                        size='md'
                                        hint={spec.role}
                                    />
                                ))}
                            </Grid>
                            <Row justify='between' gap={3} className='goal_total'>
                                <Text size='sm' weight={600}>
                                    {copy.audience.fleetTotal}
                                </Text>
                                <Text as='span' size='lg' mono weight={700} tone='fire'>
                                    {money(fleetCost)}
                                </Text>
                            </Row>
                            <Text size='xs' tone='faint'>
                                {copy.audience.fleetNote}
                            </Text>
                        </Stack>
                    </Box>
                </Grid>
            </Section>

            <Section space='md' bordered id='roadmap'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={copy.roadmap.eyebrow}
                        title={copy.roadmap.title}
                        lede={copy.roadmap.lede}
                    />

                    <Stack gap={0}>
                        {copy.roadmap.items.map((item) => (
                            <Row
                                key={item.title}
                                gap={5}
                                align='start'
                                wrap={false}
                                className='roadmap_row'
                            >
                                <Text
                                    as='span'
                                    size='2xs'
                                    mono
                                    uppercase
                                    weight={600}
                                    tone={item.done ? 'live' : 'faint'}
                                    className='roadmap_when'
                                >
                                    {item.when}
                                </Text>
                                <Stack gap={1} minWidth0>
                                    <Row gap={2}>
                                        <Heading
                                            level={3}
                                            size='sm'
                                            tone={item.done ? 'muted' : 'default'}
                                        >
                                            {item.title}
                                        </Heading>
                                        {item.done ? (
                                            <Icon name='check' size={14} label='Done' />
                                        ) : null}
                                    </Row>
                                    <Text size='sm' tone='muted' measure={84}>
                                        {item.detail}
                                    </Text>
                                </Stack>
                            </Row>
                        ))}
                    </Stack>
                </Stack>
            </Section>

            <Section space='md' tone='raised' bordered id='privacy'>
                <Grid columns={2} minColumnWidth={320} gap={7} align='start'>
                    <Stack gap={4}>
                        <SectionHead
                            eyebrow={copy.privacy.eyebrow}
                            title={copy.privacy.title}
                            size='lg'
                        />
                        <List marker='dash' gap={3}>
                            {copy.privacy.items.map((item) => (
                                <ListItem key={item}>{item}</ListItem>
                            ))}
                        </List>
                    </Stack>

                    <Stack gap={4}>
                        <SectionHead
                            eyebrow={copy.licensing.eyebrow}
                            title={copy.licensing.title}
                            size='lg'
                        />
                        <Text tone='muted' measure={70}>
                            {copy.licensing.hardwareLead}{' '}
                            <TextLink to={SITE.licenses.hardware.href} tone='fire'>
                                {SITE.licenses.hardware.name}
                            </TextLink>
                            {copy.licensing.hardwareTrail}{' '}
                            <TextLink to={SITE.licenses.firmware.href} tone='fire'>
                                {SITE.licenses.firmware.name}
                            </TextLink>
                            {copy.licensing.firmwareTrail}
                        </Text>
                        <Row gap={3}>
                            <ButtonAnchor
                                href={SITE.github}
                                iconBefore={<Icon name='github' size={16} />}
                            >
                                {copy.licensing.repoCta}
                            </ButtonAnchor>
                            <ButtonAnchor href={SITE.contact} variant='ghost'>
                                {copy.licensing.contactCta}
                            </ButtonAnchor>
                        </Row>
                    </Stack>
                </Grid>
            </Section>

            <Section space='md' tone='sunken' bordered>
                <Container width='narrow'>
                    <Stack gap={5} align='center'>
                        <Heading level={2} size='2xl' align='center' measure={28}>
                            {copy.closing.title}
                        </Heading>
                        <Text tone='muted' align='center' measure={64}>
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
                            <ButtonLink to='/open-problems' size='lg' variant='secondary'>
                                {copy.closing.secondaryCta}
                            </ButtonLink>
                        </Row>
                    </Stack>
                </Container>
            </Section>
        </Page>
    )
}

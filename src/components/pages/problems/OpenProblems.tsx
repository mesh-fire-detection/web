import { Page } from '@components/layout/Page'
import { FalsePositivePanel } from '@components/pages/problems/FalsePositivePanel'
import { ProblemCard } from '@components/pages/problems/ProblemCard'
import { Box, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { ButtonAnchor, TextLink } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { Icon } from '@components/shared/widgets/Icon'
import { SITE } from '@core/config/site'
import { openProblemsContent } from '@core/content/problems/content'
import { PROBLEMS } from '@core/content/problems/problems'

const STATUS_KIND = {
    open: 'dead',
    'in-progress': 'warn',
    'has-candidate': 'live',
} as const

export function OpenProblemsPage() {
    return (
        <Page
            title={openProblemsContent.title}
            eyebrow={openProblemsContent.eyebrow}
            lede={openProblemsContent.lede}
            aside={
                <Row gap={3}>
                    <ButtonAnchor
                        href={SITE.discussions}
                        size='md'
                        variant='primary'
                        iconAfter={<Icon name='arrow-up-right' size={14} />}
                    >
                        {openProblemsContent.claimCta}
                    </ButtonAnchor>
                </Row>
            }
        >
            <Section space='sm'>
                <Stack gap={5}>
                    <Box tone='surface-2' padding={5} radius='md'>
                        <Stack gap={4}>
                            <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                                {openProblemsContent.contentsLabel}
                            </Text>
                            <Grid columns={3} minColumnWidth={220} gap={3}>
                                {PROBLEMS.map((problem, index) => (
                                    <Row key={problem.slug} gap={3} align='start' wrap={false}>
                                        <Text as='span' size='xs' mono tone='fire' weight={600}>
                                            {String(index + 1).padStart(2, '0')}
                                        </Text>
                                        <Stack gap={1} minWidth0 align='start'>
                                            <TextLink
                                                to={`#${problem.slug}`}
                                                tone='quiet'
                                                size='sm'
                                            >
                                                {problem.title}
                                            </TextLink>
                                            <Badge kind={STATUS_KIND[problem.status]} size='xs'>
                                                {problem.status.replace('-', ' ')}
                                            </Badge>
                                        </Stack>
                                    </Row>
                                ))}
                            </Grid>
                        </Stack>
                    </Box>

                    <Text tone='muted' measure={88}>
                        {openProblemsContent.intro}
                    </Text>
                </Stack>
            </Section>

            <Section space='sm'>
                <Stack gap={5}>
                    {PROBLEMS.map((problem) => (
                        <ProblemCard key={problem.slug} problem={problem} />
                    ))}
                </Stack>
            </Section>

            <Section space='md' tone='raised' bordered>
                <FalsePositivePanel />
            </Section>

            <Section space='md' bordered>
                <Grid columns={2} minColumnWidth={320} gap={7} align='start'>
                    <Stack gap={4}>
                        <Heading level={2} size='xl' measure={30}>
                            {openProblemsContent.closing.title}
                        </Heading>
                        {openProblemsContent.closing.paragraphs.map((paragraph) => (
                            <Text key={paragraph} tone='muted' measure={70}>
                                {paragraph}
                            </Text>
                        ))}
                    </Stack>

                    <Box tone='surface' padding={6} radius='md'>
                        <Stack gap={4}>
                            <Heading level={3} size='sm'>
                                {openProblemsContent.closing.notBuildingTitle}
                            </Heading>
                            <Text size='sm' tone='muted'>
                                {openProblemsContent.closing.notBuilding}
                            </Text>
                            <Row gap={3}>
                                <ButtonAnchor
                                    href={SITE.github}
                                    size='sm'
                                    iconBefore={<Icon name='github' size={14} />}
                                >
                                    GitHub
                                </ButtonAnchor>
                            </Row>
                        </Stack>
                    </Box>
                </Grid>
            </Section>
        </Page>
    )
}

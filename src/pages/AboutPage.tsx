import { SectionHead } from '@/components/common/SectionHead'
import { NODE_TYPES } from '@/data/network'
import { SITE } from '@/data/site'
import { Page } from '@/layout/Page'
import { money } from '@/lib/format'
import {
    Badge,
    Box,
    ButtonAnchor,
    ButtonLink,
    Container,
    Grid,
    Heading,
    Icon,
    List,
    ListItem,
    Metric,
    Row,
    Section,
    Stack,
    Text,
    TextLink,
} from '@/ui'

const GOALS = [
    {
        n: '01',
        title: 'Reduce wildfire detection time',
        detail: 'The headline goal, and the one we cannot yet defend. It needs a measured baseline for a named district before it means anything. That work is open problem one.',
        status: 'Blocked on a baseline',
        kind: 'warn' as const,
    },
    {
        n: '02',
        title: 'Radically reduce the cost of detection',
        detail: 'A Base node is $70 against $10,000–20,000 for a camera install. This goal is met at the unit level; what is unproven is whether $70 nodes detect anything useful.',
        status: 'Met at the unit level',
        kind: 'live' as const,
    },
    {
        n: '03',
        title: 'Maximise the area covered',
        detail: 'Cheap units only matter if they cover ground. Fourteen nodes cover one branch of one valley. The constraint is not money — it is getting hardware to roadless ridges.',
        status: 'Bounded by delivery',
        kind: 'warn' as const,
    },
]

const ROADMAP = [
    {
        when: 'Now',
        title: 'Survive a winter',
        detail: 'Every deployed node still reporting in March. Nothing else matters until this is true.',
        done: false,
    },
    {
        when: 'Next',
        title: 'Publish a detection-time baseline',
        detail: 'One Washington district, five years of incidents, method and raw records alongside.',
        done: false,
    },
    {
        when: 'Next',
        title: 'Ninety days of labelled vision frames',
        detail: 'The false-positive number, measured through fog season rather than asserted.',
        done: false,
    },
    {
        when: 'Then',
        title: 'Ladder topology in the field',
        detail: 'Rebuild one branch so no single node is critical, and prove it by killing one on purpose.',
        done: false,
    },
    {
        when: 'Then',
        title: 'A second branch, built by someone else',
        detail: 'The real test of this site: can a stranger go from landing page to working node without asking us anything.',
        done: false,
    },
    {
        when: 'Done',
        title: 'One branch designed end to end',
        detail: 'Fourteen node positions along Rattlesnake Ridge, with a link budget for every hop. Nothing installed yet — the map shows the plan, not the field.',
        done: true,
    },
]

export function AboutPage() {
    const fleetCost = NODE_TYPES.reduce((sum, spec) => sum + spec.unitCost, 0)

    return (
        <Page
            title='About'
            eyebrow='What this is'
            lede='An open hardware project trying to make wildfire detection cheap enough to deploy everywhere it is needed, instead of only where a budget already exists.'
        >
            <Section space='md' id='goals'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow='Goals'
                        title='Three goals, honestly scored'
                        lede='Two of the three are not met, and one of them cannot even be measured yet. Scoring them in public is cheaper than being caught out later.'
                    />

                    <Stack gap={4}>
                        {GOALS.map((goal) => (
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
                                            {goal.detail}
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
                            eyebrow='Who this is for'
                            title='Builders first, agencies second'
                            size='lg'
                        />
                        <Text tone='muted' measure={72}>
                            This site is written for someone who would build and deploy a node
                            themselves. That choice shapes everything: the bill of materials sits
                            above the manifesto, the open problems are published rather than hidden,
                            and every claim is either measured or marked unmeasured.
                        </Text>
                        <Text tone='muted' measure={72}>
                            Agencies and land trusts are the second audience, and they need
                            something different — a false-positive rate, an alerting model, and a
                            clear statement that this is not an emergency service. Those pages exist
                            too, and they say honestly that the numbers are not in yet.
                        </Text>
                    </Stack>

                    <Box tone='surface' padding={6} radius='md'>
                        <Stack gap={5}>
                            <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                                One of each node type
                            </Text>
                            <Grid columns={2} gap={5}>
                                {NODE_TYPES.map((spec) => (
                                    <Metric
                                        key={spec.type}
                                        label={spec.name}
                                        value={money(spec.unitCost)}
                                        size='md'
                                        hint={spec.role}
                                    />
                                ))}
                            </Grid>
                            <Row justify='between' gap={3} className='goal_total'>
                                <Text size='sm' weight={600}>
                                    One of each
                                </Text>
                                <Text as='span' size='lg' mono weight={700} tone='fire'>
                                    {money(fleetCost)}
                                </Text>
                            </Row>
                            <Text size='xs' tone='faint'>
                                Less than one percent of a single camera install.
                            </Text>
                        </Stack>
                    </Box>
                </Grid>
            </Section>

            <Section space='md' bordered id='roadmap'>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow='Roadmap'
                        title='What happens next, in order'
                        lede='Deliberately short. A roadmap with twenty items on it is a wish list.'
                    />

                    <Stack gap={0}>
                        {ROADMAP.map((item) => (
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
                        <SectionHead eyebrow='Privacy' title='What this site collects' size='lg' />
                        <List marker='dash' gap={3}>
                            <ListItem>
                                No analytics, no cookies, no third-party scripts. The map draws node
                                geometry on a blank canvas and makes no tile requests.
                            </ListItem>
                            <ListItem>
                                Node positions are published deliberately. They are on public land
                                or on land whose owner agreed in writing to the position being
                                public.
                            </ListItem>
                            <ListItem>
                                Vision nodes point at terrain, not at roads, homes or trailheads.
                                Frames that trigger an alert are kept; the rest are discarded on the
                                node.
                            </ListItem>
                            <ListItem>
                                Alert subscriptions are opt-in by area, and the list is never shared
                                with an agency that has not been asked for in writing by the
                                subscriber.
                            </ListItem>
                        </List>
                    </Stack>

                    <Stack gap={4}>
                        <SectionHead eyebrow='Licensing' title='Both halves are open' size='lg' />
                        <Text tone='muted' measure={70}>
                            Hardware designs, enclosures and documentation are{' '}
                            <TextLink to={SITE.licenses.hardware.href} tone='fire'>
                                {SITE.licenses.hardware.name}
                            </TextLink>
                            , which is strongly reciprocal — improve a shell and the improvement
                            comes back. Firmware and this site are{' '}
                            <TextLink to={SITE.licenses.firmware.href} tone='fire'>
                                {SITE.licenses.firmware.name}
                            </TextLink>
                            , so nothing stops a district from running its own fork.
                        </Text>
                        <Row gap={3}>
                            <ButtonAnchor
                                href={SITE.github}
                                iconBefore={<Icon name='github' size={16} />}
                            >
                                Repository
                            </ButtonAnchor>
                            <ButtonAnchor href={SITE.contact} variant='ghost'>
                                Contact
                            </ButtonAnchor>
                        </Row>
                    </Stack>
                </Grid>
            </Section>

            <Section space='md' tone='sunken' bordered>
                <Container width='narrow'>
                    <Stack gap={5} align='center'>
                        <Heading level={2} size='2xl' align='center' measure={28}>
                            The next useful thing is a node that survives March.
                        </Heading>
                        <Text tone='muted' align='center' measure={64}>
                            Not a donation, not a mailing list. If you want to help, build one and
                            tell us what broke.
                        </Text>
                        <Row gap={3} justify='center'>
                            <ButtonLink
                                to='/build'
                                size='lg'
                                iconAfter={<Icon name='arrow-right' size={16} />}
                            >
                                Build a Node
                            </ButtonLink>
                            <ButtonLink to='/open-problems' size='lg' variant='secondary'>
                                Or take an open problem
                            </ButtonLink>
                        </Row>
                    </Stack>
                </Container>
            </Section>
        </Page>
    )
}

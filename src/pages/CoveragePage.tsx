import { Callout } from '@/components/common/Callout'
import { SectionHead } from '@/components/common/SectionHead'
import { CoverageCalculator } from '@/components/coverage/CoverageCalculator'
import { Page } from '@/layout/Page'
import {
    Box,
    DescriptionItem,
    DescriptionList,
    Grid,
    Heading,
    List,
    ListItem,
    Row,
    Section,
    Stack,
    Text,
    TextLink,
} from '@/ui'

const PRIOR_ART = [
    {
        name: 'Meshtastic Site Planner',
        detail: 'Terrain-aware coverage for Meshtastic nodes, using real elevation data. Start here if you have a specific site.',
        href: 'https://site.meshtastic.org/',
    },
    {
        name: 'Splat!',
        detail: 'RF propagation over SRTM terrain, Longley-Rice ITM. The serious tool, and free.',
        href: 'https://www.qsl.net/kd2bd/splat.html',
    },
    {
        name: 'SRTM elevation data',
        detail: '30 m global elevation from NASA. What any terrain-aware viewshed is built on.',
        href: 'https://www.earthdata.nasa.gov/data/instruments/srtm',
    },
]

export function CoveragePage() {
    return (
        <Page
            title='Coverage calculator'
            eyebrow='Link budget'
            lede='Would this work where you live? Set two antenna heights and a distance and find out whether the hop closes — and how many nodes a corridor would take.'
        >
            <Section space='sm'>
                <CoverageCalculator />
            </Section>

            <Section space='md' tone='raised' bordered>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow='What this is and is not'
                        title='First-order answer, not a viewshed'
                        lede='This calculator has no elevation model behind it. It knows the earth is curved and it knows forest costs you signal. It does not know about the ridge between your two points.'
                    />

                    <Grid columns={2} minColumnWidth={320} gap={6} align='start'>
                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    What it models
                                </Heading>
                                <List marker='dash' gap={2}>
                                    <ListItem size='sm'>Free-space path loss at 915 MHz.</ListItem>
                                    <ListItem size='sm'>
                                        A distance-proportional excess loss for vegetation and
                                        clutter.
                                    </ListItem>
                                    <ListItem size='sm'>
                                        The 4/3-earth radio horizon from both antenna heights.
                                    </ListItem>
                                    <ListItem size='sm'>
                                        First Fresnel zone radius, so you know how much clearance to
                                        hold.
                                    </ListItem>
                                    <ListItem size='sm'>
                                        Receiver sensitivity for each Meshtastic preset.
                                    </ListItem>
                                </List>
                            </Stack>
                        </Box>

                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    What it does not
                                </Heading>
                                <List marker='dash' gap={2}>
                                    <ListItem size='sm'>
                                        Terrain. There is no elevation data in this page.
                                    </ListItem>
                                    <ListItem size='sm'>
                                        Diffraction over an obstruction, which can save a link this
                                        calculator calls dead.
                                    </ListItem>
                                    <ListItem size='sm'>Ground reflection and multipath.</ListItem>
                                    <ListItem size='sm'>
                                        Seasonal foliage, which is why the fade margin defaults to
                                        10 dB.
                                    </ListItem>
                                    <ListItem size='sm'>
                                        Interference from anything else on the band.
                                    </ListItem>
                                </List>
                            </Stack>
                        </Box>
                    </Grid>

                    <Callout title='Use this to rule sites out, not to commit to one' tone='warn'>
                        If the calculator says a hop does not close, believe it — the real world
                        only adds loss. If it says the hop closes, that is a hypothesis you confirm
                        against terrain and then on site with two nodes and a walk.
                    </Callout>
                </Stack>
            </Section>

            <Section space='md' bordered>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow='Prior art'
                        title='Tools that do know about terrain'
                        lede='There is no reason to rebuild any of this. When you have a real site, take the numbers from here into one of these.'
                    />

                    <Grid columns={3} minColumnWidth={260} gap={4}>
                        {PRIOR_ART.map((tool) => (
                            <Box key={tool.name} tone='surface' padding={5} radius='md' grow>
                                <Stack gap={3} grow>
                                    <Heading level={3} size='sm'>
                                        {tool.name}
                                    </Heading>
                                    <Text size='sm' tone='muted' className='grow'>
                                        {tool.detail}
                                    </Text>
                                    <TextLink to={tool.href} tone='fire' size='xs'>
                                        Open
                                    </TextLink>
                                </Stack>
                            </Box>
                        ))}
                    </Grid>
                </Stack>
            </Section>

            <Section space='md' tone='sunken' bordered>
                <Grid columns={2} minColumnWidth={320} gap={7} align='start'>
                    <Stack gap={4}>
                        <SectionHead
                            eyebrow='The maths'
                            title='Everything this page computes'
                            size='lg'
                        />
                        <Text tone='muted' measure={70}>
                            No black box. These are the four equations behind every number on this
                            page, and the implementation is a hundred lines you can read in the
                            repository.
                        </Text>
                    </Stack>

                    <DescriptionList columns={1}>
                        <DescriptionItem term='Free-space path loss'>
                            FSPL(dB) = 20·log₁₀(d km) + 20·log₁₀(f MHz) + 32.44
                        </DescriptionItem>
                        <DescriptionItem term='Received power'>
                            P(dBm) = P_tx + G_tx + G_rx − L_cable − FSPL − (excess dB/km × d)
                        </DescriptionItem>
                        <DescriptionItem term='Radio horizon (4/3 earth)'>
                            d(km) = 4.12 · (√h₁ + √h₂), heights in metres
                        </DescriptionItem>
                        <DescriptionItem term='First Fresnel radius'>
                            r(m) = 17.31 · √(d₁·d₂ / (f GHz · d)), distances in km
                        </DescriptionItem>
                        <DescriptionItem term='Link closes when'>
                            Received power ≥ preset sensitivity + your fade margin, and d ≤ radio
                            horizon
                        </DescriptionItem>
                    </DescriptionList>
                </Grid>
            </Section>

            <Section space='sm'>
                <Row justify='center'>
                    <Text size='sm' tone='faint' align='center' measure={80}>
                        Sensitivity figures are typical SX1262 values for each spreading factor and
                        bandwidth. Your radio will differ by a decibel or two, which is well inside
                        the fade margin.
                    </Text>
                </Row>
            </Section>
        </Page>
    )
}

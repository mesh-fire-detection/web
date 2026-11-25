import type { ReactNode } from 'react'

import { Group, Specimen } from '@components/pages/site/design/Specimen'
import {
    Box,
    Container,
    Divider,
    Grid,
    Row,
    ScrollArea,
    Section,
    Spacer,
    Stack,
} from '@components/shared/primitives/Layout'
import { Eyebrow, Heading } from '@components/shared/typography/Heading'
import {
    Break,
    CodeBlock,
    Strong,
    Text,
    Value,
    type TextSize,
    type TextWeight,
    type Tone,
} from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'

const SWATCH_CLASS = {
    bg: 'design_swatch_bg',
    bg_sunken: 'design_swatch_bg_sunken',
    surface: 'design_swatch_surface',
    surface_2: 'design_swatch_surface_2',
    surface_3: 'design_swatch_surface_3',
    line: 'design_swatch_line',
    line_strong: 'design_swatch_line_strong',
    text: 'design_swatch_text',
    text_2: 'design_swatch_text_2',
    text_3: 'design_swatch_text_3',
    fire: 'design_swatch_fire',
    fire_dim: 'design_swatch_fire_dim',
    fire_wash: 'design_swatch_fire_wash',
    live: 'design_swatch_live',
    live_wash: 'design_swatch_live_wash',
    warn: 'design_swatch_warn',
    warn_wash: 'design_swatch_warn_wash',
    dead: 'design_swatch_dead',
    dead_wash: 'design_swatch_dead_wash',
    link: 'design_swatch_link',
    bluetooth: 'design_swatch_bluetooth',
    usb: 'design_swatch_usb',
} as const
const SPACE_CLASS = {
    1: 'design_space_1',
    2: 'design_space_2',
    3: 'design_space_3',
    4: 'design_space_4',
    5: 'design_space_5',
    6: 'design_space_6',
    7: 'design_space_7',
    8: 'design_space_8',
    9: 'design_space_9',
    10: 'design_space_10',
} as const
const RADIUS_CLASS = {
    sm: 'design_radius_sm',
    md: 'design_radius_md',
    lg: 'design_radius_lg',
    full: 'design_radius_full',
} as const
const TONES: readonly Tone[] = [
    'default',
    'muted',
    'faint',
    'fire',
    'live',
    'warn',
    'dead',
    'liveSoft',
    'warnSoft',
    'deadSoft',
]
const TEXT_SIZES: readonly TextSize[] = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl']
const WEIGHTS: readonly TextWeight[] = [400, 500, 600, 700]
const HEADING_SIZES = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const
const BOX_TONES = [
    'surface',
    'surface-2',
    'surface-3',
    'transparent',
    'fire',
    'live',
    'warn',
    'dead',
] as const
const ACCENTS = ['fire', 'live', 'warn', 'dead'] as const
const LONG =
    'A sensor on a ridge hears smoke before anyone sees it, and the mesh carries that word from node to node until a gateway puts it on the internet.'

function Token({ name, children }: { readonly name: string; readonly children: ReactNode }) {
    return (
        <Stack gap={1}>
            {children}
            <Text size='2xs' mono tone='faint'>
                {name}
            </Text>
        </Stack>
    )
}

export function Foundations() {
    return (
        <Specimen
            title='Foundations'
            lede='The tokens every component draws from: colour, type, space, radius and motion.'
        >
            <Group label='Colour'>
                <Grid minColumnWidth={110} gap={3}>
                    {Object.entries(SWATCH_CLASS).map(([name, className]) => (
                        <Token key={name} name={`--${name}`}>
                            <div className={cx('design_swatch', className)} />
                        </Token>
                    ))}
                </Grid>
            </Group>
            <Group label='Type scale'>
                <Stack gap={2}>
                    {TEXT_SIZES.map((size) => (
                        <Row key={size} gap={4} align='baseline' wrap={false}>
                            <Text size='2xs' mono tone='faint'>
                                {size}
                            </Text>
                            <Text size={size}>The mesh carries the alarm</Text>
                        </Row>
                    ))}
                    <Text mono>Monospace: JetBrains Mono 0123456789</Text>
                </Stack>
            </Group>
            <Group label='Space'>
                <Stack gap={2}>
                    {Object.entries(SPACE_CLASS).map(([space, className]) => (
                        <Row key={space} gap={4} wrap={false}>
                            <Text size='2xs' mono tone='faint'>
                                --s_{space}
                            </Text>
                            <div className={cx('design_space', className)} />
                        </Row>
                    ))}
                </Stack>
            </Group>
            <Group label='Radius'>
                <Row gap={5}>
                    {Object.entries(RADIUS_CLASS).map(([radius, className]) => (
                        <Token key={radius} name={`--r_${radius}`}>
                            <div className={cx('design_radius', className)} />
                        </Token>
                    ))}
                </Row>
            </Group>
            <Group label='Motion and shadow (hover)'>
                <Token name='--duration_standard · --ease · --lift_distance · --shadow_lg'>
                    <div className='design_motion' />
                </Token>
            </Group>
        </Specimen>
    )
}

export function Typography() {
    return (
        <Specimen title='Typography' lede='Semantic levels, sizes chosen separately.'>
            <Group label='Heading sizes'>
                <Stack gap={3}>
                    {HEADING_SIZES.map((size) => (
                        <Heading key={size} level={3} size={size} truncate>
                            Heading {size}
                        </Heading>
                    ))}
                </Stack>
            </Group>
            <Group label='Heading options'>
                <Stack gap={3}>
                    <Heading level={4} size='lg' tone='fire'>
                        Fire tone
                    </Heading>
                    <Heading level={4} size='lg' mono>
                        Monospace heading
                    </Heading>
                    <Heading level={4} size='lg' align='center'>
                        Centred heading
                    </Heading>
                    <Heading level={4} size='lg' measure={20}>
                        A heading held to a measure of twenty characters
                    </Heading>
                </Stack>
            </Group>
            <Group label='Eyebrow tones'>
                <Row gap={5}>
                    <Eyebrow>Fire (default)</Eyebrow>
                    <Eyebrow tone='muted'>Muted</Eyebrow>
                    <Eyebrow tone='live'>Live</Eyebrow>
                </Row>
            </Group>
            <Group label='Text tones'>
                <Row gap={4}>
                    {TONES.map((tone) => (
                        <Text key={tone} as='span' tone={tone}>
                            {tone}
                        </Text>
                    ))}
                </Row>
            </Group>
            <Group label='Text weights'>
                <Row gap={4}>
                    {WEIGHTS.map((weight) => (
                        <Text key={weight} as='span' weight={weight}>
                            Weight {weight}
                        </Text>
                    ))}
                </Row>
            </Group>
            <Group label='Text options'>
                <Stack gap={3}>
                    <Text mono>Monospace</Text>
                    <Text uppercase size='xs' weight={600}>
                        Uppercase
                    </Text>
                    <Text align='center'>Centred</Text>
                    <Text align='end'>End-aligned</Text>
                    <Text measure={40}>Held to a measure: {LONG}</Text>
                    <Text clamp={2}>
                        Clamped to two lines: {LONG} {LONG}
                    </Text>
                    <Text truncate>Truncated to one line: {LONG}</Text>
                </Stack>
            </Group>
            <Group label='Inline'>
                <Text>
                    Body text with <Strong>strong</Strong>, <Strong tone='fire'>strong fire</Strong>
                    , a value <Value>42 km</Value>, a toned value <Value tone='live'>−90 dBm</Value>
                    .<Break />
                    After a break.
                </Text>
            </Group>
            <Group label='Code block'>
                <CodeBlock>{'const status = "online"\nconst battery = 3.91 // volts'}</CodeBlock>
            </Group>
        </Specimen>
    )
}

export function Surfaces() {
    return (
        <Specimen title='Layout and surfaces'>
            <Group label='Box tones'>
                <Grid minColumnWidth={140} gap={3}>
                    {BOX_TONES.map((tone) => (
                        <Box key={tone} tone={tone}>
                            <Text size='sm'>{tone}</Text>
                        </Box>
                    ))}
                </Grid>
            </Group>
            <Group label='Box accents'>
                <Grid minColumnWidth={140} gap={3}>
                    {ACCENTS.map((accent) => (
                        <Box key={accent} accent={accent}>
                            <Text size='sm'>{accent}</Text>
                        </Box>
                    ))}
                </Grid>
            </Group>
            <Group label='Box radius, border, padding and lift'>
                <Grid minColumnWidth={140} gap={3}>
                    <Box radius='none'>Radius none</Box>
                    <Box radius='sm'>Radius sm</Box>
                    <Box radius='lg'>Radius lg</Box>
                    <Box border={false} tone='surface-2'>
                        No border
                    </Box>
                    <Box padding={2}>Padding 2</Box>
                    <Box padding={8}>Padding 8</Box>
                    <Box lift>Lift (hover)</Box>
                </Grid>
            </Group>
            <Group label='Section tones'>
                <Stack gap={3}>
                    {(['default', 'raised', 'sunken'] as const).map((tone) => (
                        <Section key={tone} tone={tone} space='sm' bordered>
                            <Text size='sm'>Section {tone}</Text>
                        </Section>
                    ))}
                    <Section space='sm' grid bordered>
                        <Text size='sm'>Section with grid background</Text>
                    </Section>
                </Stack>
            </Group>
            <Group label='Container widths'>
                <Stack gap={3}>
                    {(['narrow', 'default', 'wide'] as const).map((width) => (
                        <Container key={width} width={width}>
                            <Box tone='surface-2' padding={2}>
                                <Text size='sm'>Container {width}</Text>
                            </Box>
                        </Container>
                    ))}
                </Stack>
            </Group>
            <Group label='Grid columns'>
                <Stack gap={3}>
                    {([2, 3, 4, 6] as const).map((columns) => (
                        <Grid key={columns} columns={columns} gap={2}>
                            {Array.from({ length: columns }, (_, index) => (
                                <Box key={index} tone='surface-2' padding={2}>
                                    <Text size='xs' mono>
                                        {index + 1}/{columns}
                                    </Text>
                                </Box>
                            ))}
                        </Grid>
                    ))}
                </Stack>
            </Group>
            <Group label='Divider and spacer'>
                <Stack gap={0}>
                    <Text size='sm'>Above a plain divider</Text>
                    <Divider />
                    <Text size='sm'>Above a labelled divider</Text>
                    <Divider label='or' />
                    <Text size='sm'>Above a spacer of 6</Text>
                    <Spacer size={6} />
                    <Text size='sm'>Below the spacer</Text>
                </Stack>
            </Group>
            <Group label='Scroll area'>
                <ScrollArea label='Scrollable example'>
                    <CodeBlock>{`${LONG} ${LONG}`}</CodeBlock>
                </ScrollArea>
            </Group>
        </Specimen>
    )
}

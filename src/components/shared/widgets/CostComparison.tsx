import { List, ListItem } from '@components/shared/page/List'
import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text, Value } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { nodeCost } from '@core/content/build/bom'
import { money } from '@core/format/format'

type Side = {
    label: string
    name: string
    price: number
    priceNote: string
    points: readonly string[]
    source: { label: string; href: string }
    kind: 'incumbent' | 'ours'
}

const INCUMBENT: Side = {
    label: 'Camera install, per site',
    name: 'ALERTWildfire',
    price: 15_000,
    priceNote: '$10,000 – $20,000 installed',
    points: [
        'Pan-tilt-zoom camera on a purpose-built tower',
        'Utility power and a dedicated backhaul link',
        'Professional install, usually by helicopter or a road crew',
        'Losing one site is an expensive incident',
    ],
    source: {
        label: 'ALERTWildfire program costs',
        href: 'https://www.alertwildfire.org/',
    },
    kind: 'incumbent',
}

const OURS: Side = {
    label: 'Estimated parts cost per Base node',
    name: 'Mesh Fire Detection',
    price: nodeCost('base'),
    priceNote: 'Five-part BOM, before shipping and tax',
    points: [
        'LoRa radio on a printed IP65 shell',
        'Solar and a protected battery pack — no utility power',
        'Carried in and mounted by one person in an afternoon',
        'Losing one node is a Saturday, not a budget line',
    ],
    source: { label: 'Full bill of materials', href: '/build#bom' },
    kind: 'ours',
}

const RATIO = Math.round(INCUMBENT.price / OURS.price)

function Column({ side }: { side: Side }) {
    const ours = side.kind === 'ours'
    return (
        <Box
            tone={ours ? 'surface-2' : 'surface'}
            padding={6}
            radius='md'
            className={`cost_col cost_col_${side.kind}`}
            grow
        >
            <Stack gap={5}>
                <Row justify='between' gap={3}>
                    <Text size='2xs' mono uppercase weight={600} tone='faint'>
                        {side.label}
                    </Text>
                    {ours ? <Badge kind='fire'>This project</Badge> : <Badge>Today</Badge>}
                </Row>

                <Stack gap={2}>
                    <Heading
                        level={3}
                        size={ours ? '4xl' : '2xl'}
                        tone={ours ? 'fire' : 'muted'}
                        mono
                    >
                        {money(side.price)}
                    </Heading>
                    <Text size='sm' tone='faint'>
                        {side.priceNote}
                    </Text>
                </Stack>

                <List marker='dash' gap={2}>
                    {side.points.map((point) => (
                        <ListItem key={point} size='sm'>
                            {point}
                        </ListItem>
                    ))}
                </List>

                <TextLink to={side.source.href} tone='quiet' size='xs'>
                    {side.source.label}
                </TextLink>
            </Stack>
        </Box>
    )
}

export function CostComparison() {
    return (
        <Stack gap={5}>
            <Grid columns={2} gap={4} align='stretch'>
                <Column side={INCUMBENT} />
                <Column side={OURS} />
            </Grid>

            <Row gap={3} justify='center' className='cost_ratio'>
                <Text as='div' size='sm' tone='muted' align='center' measure={90}>
                    At current component prices, one camera installation costs about as much as{' '}
                    <Value tone='fire' size='sm'>
                        {RATIO}
                    </Value>{' '}
                    Base nodes. That ratio is the entire argument — everything else on this site
                    exists to make it believable.
                </Text>
            </Row>
        </Stack>
    )
}

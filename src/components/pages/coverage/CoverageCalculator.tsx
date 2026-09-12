import { useMemo, useState } from 'react'

import { useUnitSystem } from '@components/app/UnitsProvider'
import { Box, Divider, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text, Value } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Badge, Metric } from '@components/shared/widgets/Badge'
import { NumberField, SegmentedField, SelectField, SliderField } from '@components/shared/widgets/Field'
import { decimal, money, plural, signed } from '@core/format/format'
import {
    formatDistance,
    formatLength,
    toFeet,
    toKm,
    toMeters,
    toMiles,
    type UnitSystem,
} from '@core/format/units'
import {
    computeLink,
    DEFAULT_LINK,
    nodesForCorridor,
    PRESETS,
    TERRAINS,
    type LinkInput,
} from '@core/map/linkBudget'

import { LinkProfile } from './LinkProfile'

const VERDICT = {
    strong: {
        kind: 'live' as const,
        label: 'Strong link',
        copy: 'Comfortable margin. This hop will survive weather and foliage growth.',
    },
    workable: {
        kind: 'live' as const,
        label: 'Link closes',
        copy: 'Clears the fade margin you asked for. Verify on site before you commit a mast.',
    },
    marginal: {
        kind: 'warn' as const,
        label: 'Marginal',
        copy: 'Above sensitivity but inside your fade margin. It works on a good day and drops on a wet one.',
    },
    'no-link': {
        kind: 'dead' as const,
        label: 'No link',
        copy: 'Below sensitivity or past the radio horizon. Raise an antenna, shorten the hop, or slow the preset.',
    },
}

const PRESET_OPTIONS = PRESETS.map((preset) => ({ value: preset.id, label: preset.label }))
const TERRAIN_OPTIONS = TERRAINS.map((terrain) => ({ value: terrain.id, label: terrain.label }))
const CORRIDOR_KM = 25

function hopSlider(system: UnitSystem) {
    return system === 'imperial'
        ? { min: 0.1, max: 20, step: 0.1 }
        : { min: 0.2, max: 30, step: 0.1 }
}

export function CoverageCalculator() {
    const { system } = useUnitSystem()
    const [input, setInput] = useState<LinkInput>(DEFAULT_LINK)
    const result = useMemo(() => computeLink(input), [input])
    const hop = hopSlider(system)
    const heightMax = system === 'imperial' ? 400 : 120
    const heightSuffix = system === 'imperial' ? 'ft AGL' : 'm AGL'

    const set =
        <K extends keyof LinkInput>(key: K) =>
        (value: LinkInput[K]) => {
            setInput((prev) => ({ ...prev, [key]: value }))
        }

    const verdict = VERDICT[result.verdict]
    const nodesNeeded = nodesForCorridor(CORRIDOR_KM, result.maxRangeKm)

    return (
        <Grid columns={2} minColumnWidth={340} gap={5} align='stretch'>
            <Box tone='surface' padding={6} radius='md'>
                <Stack gap={6}>
                    <Row justify='between' gap={3}>
                        <Heading level={3} size='md'>
                            The link
                        </Heading>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                setInput(DEFAULT_LINK)
                            }}
                        >
                            Reset
                        </Button>
                    </Row>

                    <SliderField
                        format={(value) =>
                            system === 'imperial' ? `${decimal(value)} mi` : `${decimal(value)} km`
                        }
                        label='Hop distance'
                        max={hop.max}
                        min={hop.min}
                        onChange={(value) => {
                            set('distanceKm')(system === 'imperial' ? toKm(value) : value)
                        }}
                        step={hop.step}
                        value={system === 'imperial' ? toMiles(input.distanceKm) : input.distanceKm}
                    />

                    <Grid columns={2} gap={4}>
                        <NumberField
                            label='Transmit antenna'
                            max={heightMax}
                            min={0}
                            onChange={(value) => {
                                set('txHeightM')(system === 'imperial' ? toMeters(value) : value)
                            }}
                            suffix={heightSuffix}
                            value={
                                system === 'imperial'
                                    ? Math.round(toFeet(input.txHeightM))
                                    : input.txHeightM
                            }
                        />
                        <NumberField
                            label='Receive antenna'
                            max={heightMax}
                            min={0}
                            onChange={(value) => {
                                set('rxHeightM')(system === 'imperial' ? toMeters(value) : value)
                            }}
                            suffix={heightSuffix}
                            value={
                                system === 'imperial'
                                    ? Math.round(toFeet(input.rxHeightM))
                                    : input.rxHeightM
                            }
                        />
                    </Grid>

                    <SelectField
                        hint={TERRAINS.find((terrain) => terrain.id === input.terrain)?.note}
                        label='Terrain between them'
                        onChange={set('terrain')}
                        options={TERRAIN_OPTIONS}
                        value={input.terrain}
                    />

                    <SegmentedField
                        label='Meshtastic preset'
                        onChange={set('preset')}
                        options={PRESET_OPTIONS}
                        value={input.preset}
                    />

                    <Divider space={0} />

                    <Grid columns={2} gap={4}>
                        <NumberField
                            hint='US915 cap: 30'
                            label='TX power'
                            max={30}
                            min={2}
                            onChange={set('txPowerDbm')}
                            suffix='dBm'
                            value={input.txPowerDbm}
                        />
                        <NumberField
                            label='Fade margin'
                            max={30}
                            min={0}
                            onChange={set('fadeMarginDb')}
                            suffix='dB'
                            value={input.fadeMarginDb}
                        />
                        <NumberField
                            label='TX antenna gain'
                            max={12}
                            min={0}
                            onChange={set('txGainDbi')}
                            step={0.05}
                            suffix='dBi'
                            value={input.txGainDbi}
                        />
                        <NumberField
                            label='RX antenna gain'
                            max={12}
                            min={0}
                            onChange={set('rxGainDbi')}
                            step={0.05}
                            suffix='dBi'
                            value={input.rxGainDbi}
                        />
                    </Grid>
                </Stack>
            </Box>

            <Stack gap={4}>
                <Box
                    accent={verdict.kind === 'live' ? 'live' : verdict.kind}
                    padding={6}
                    radius='md'
                    tone='surface-2'
                >
                    <Stack gap={5}>
                        <Row justify='between' gap={3}>
                            <Badge kind={verdict.kind}>{verdict.label}</Badge>
                            <Text as='span' size='2xs' mono tone='faint' uppercase>
                                {input.frequencyMhz} MHz
                            </Text>
                        </Row>

                        <Row gap={7} wrap>
                            <Metric
                                hint={`over ${result.sensitivityDbm} dBm sensitivity`}
                                label='Link margin'
                                size='lg'
                                tone={
                                    result.marginDb >= input.fadeMarginDb
                                        ? 'live'
                                        : result.marginDb >= 0
                                          ? 'warn'
                                          : 'dead'
                                }
                                value={`${signed(result.marginDb, 1)} dB`}
                            />
                            <Metric
                                hint='at these settings'
                                label='Max hop'
                                size='lg'
                                tone='fire'
                                value={formatDistance(result.maxRangeKm, system)}
                            />
                        </Row>

                        <Text size='sm' tone='muted' measure={62}>
                            {verdict.copy}
                        </Text>
                    </Stack>
                </Box>

                <LinkProfile input={input} result={result} />

                <Box tone='surface' padding={5} radius='md'>
                    <Stack gap={4}>
                        <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                            Budget breakdown
                        </Text>
                        <Stack gap={2}>
                            <BudgetRow
                                label='Free-space path loss'
                                value={`-${decimal(result.fsplDb)} dB`}
                            />
                            <BudgetRow
                                label='Terrain excess loss'
                                value={`-${decimal(result.excessLossDb)} dB`}
                            />
                            <BudgetRow
                                label='Cable and connectors'
                                value={`-${decimal(input.cableLossDb)} dB`}
                            />
                            <BudgetRow
                                emphasis
                                label='Received power'
                                value={`${decimal(result.receivedDbm)} dBm`}
                            />
                            <BudgetRow
                                label='Radio horizon (4/3 earth)'
                                value={formatDistance(result.radioHorizonKm, system)}
                            />
                            <BudgetRow
                                hint='clearance you need above any obstruction'
                                label='Fresnel radius at mid-path'
                                value={formatLength(result.fresnelRadiusM, system, { places: 1 })}
                            />
                        </Stack>
                    </Stack>
                </Box>

                <Box accent='fire' border={false} padding={5} radius='sm' tone='fire'>
                    <Stack gap={2}>
                        <Text size='sm' weight={600}>
                            What that buys you
                        </Text>
                        <Text size='sm' tone='muted' measure={64}>
                            A {formatDistance(CORRIDOR_KM, system)} corridor at this hop length needs{' '}
                            <Value tone='fire' size='sm'>
                                {nodesNeeded}
                            </Value>{' '}
                            Base {plural(nodesNeeded, 'node')} — about{' '}
                            <Value tone='fire' size='sm'>
                                {money(nodesNeeded * 70)}
                            </Value>{' '}
                            in hardware. One camera site costs more than that.
                        </Text>
                    </Stack>
                </Box>
            </Stack>
        </Grid>
    )
}

function BudgetRow({
    label,
    value,
    hint,
    emphasis = false,
}: {
    label: string
    value: string
    hint?: string | undefined
    emphasis?: boolean | undefined
}) {
    return (
        <Stack gap={0}>
            <Row
                className={emphasis ? 'budget_emphasis' : undefined}
                gap={3}
                justify='between'
                wrap={false}
            >
                <Text
                    as='span'
                    size='sm'
                    tone={emphasis ? 'default' : 'muted'}
                    weight={emphasis ? 600 : 400}
                >
                    {label}
                </Text>
                <Value size='sm' tone={emphasis ? 'fire' : 'muted'} weight={emphasis ? 600 : 500}>
                    {value}
                </Value>
            </Row>
            {hint ? (
                <Text size='2xs' tone='faint'>
                    {hint}
                </Text>
            ) : null}
        </Stack>
    )
}

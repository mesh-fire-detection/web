import { useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  Heading,
  Metric,
  NumberField,
  Row,
  SegmentedField,
  SelectField,
  SliderField,
  Stack,
  Text,
  Value,
} from '@/ui'
import { DEFAULT_LINK, PRESETS, TERRAINS, computeLink, nodesForCorridor } from '@/lib/linkBudget'
import type { LinkInput, Preset, Terrain } from '@/lib/linkBudget'
import { decimal, money, plural, signed } from '@/lib/format'
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

export function CoverageCalculator() {
  const [input, setInput] = useState<LinkInput>(DEFAULT_LINK)
  const result = useMemo(() => computeLink(input), [input])

  const set =
    <K extends keyof LinkInput>(key: K) =>
    (value: LinkInput[K]) =>
      setInput((prev) => ({ ...prev, [key]: value }))

  const verdict = VERDICT[result.verdict]
  const nodesNeeded = nodesForCorridor(CORRIDOR_KM, result.maxRangeKm)

  return (
    <Grid columns={2} minColumnWidth={340} gap={5} align="stretch">
      <Box tone="surface" padding={6} radius="md">
        <Stack gap={6}>
          <Row justify="between" gap={3}>
            <Heading level={3} size="md">
              The link
            </Heading>
            <Button variant="ghost" size="sm" onClick={() => setInput(DEFAULT_LINK)}>
              Reset
            </Button>
          </Row>

          <SliderField
            label="Hop distance"
            value={input.distanceKm}
            onChange={set('distanceKm')}
            min={0.2}
            max={30}
            step={0.1}
            format={(value) => `${decimal(value)} km`}
          />

          <Grid columns={2} gap={4}>
            <NumberField
              label="Transmit antenna"
              value={input.txHeightM}
              onChange={set('txHeightM')}
              min={0}
              max={120}
              suffix="m AGL"
            />
            <NumberField
              label="Receive antenna"
              value={input.rxHeightM}
              onChange={set('rxHeightM')}
              min={0}
              max={120}
              suffix="m AGL"
            />
          </Grid>

          <SelectField
            label="Terrain between them"
            value={input.terrain}
            options={TERRAIN_OPTIONS}
            onChange={set('terrain') as (next: Terrain) => void}
            hint={TERRAINS.find((terrain) => terrain.id === input.terrain)?.note}
          />

          <SegmentedField
            label="Meshtastic preset"
            value={input.preset}
            options={PRESET_OPTIONS}
            onChange={set('preset') as (next: Preset) => void}
          />

          <Divider space={0} />

          <Grid columns={2} gap={4}>
            <NumberField
              label="TX power"
              value={input.txPowerDbm}
              onChange={set('txPowerDbm')}
              min={2}
              max={30}
              suffix="dBm"
              hint="US915 cap: 30"
            />
            <NumberField
              label="Fade margin"
              value={input.fadeMarginDb}
              onChange={set('fadeMarginDb')}
              min={0}
              max={30}
              suffix="dB"
            />
            <NumberField
              label="TX antenna gain"
              value={input.txGainDbi}
              onChange={set('txGainDbi')}
              min={0}
              max={12}
              step={0.05}
              suffix="dBi"
            />
            <NumberField
              label="RX antenna gain"
              value={input.rxGainDbi}
              onChange={set('rxGainDbi')}
              min={0}
              max={12}
              step={0.05}
              suffix="dBi"
            />
          </Grid>
        </Stack>
      </Box>

      <Stack gap={4}>
        <Box
          tone="surface-2"
          padding={6}
          radius="md"
          accent={verdict.kind === 'live' ? 'live' : verdict.kind}
        >
          <Stack gap={5}>
            <Row justify="between" gap={3}>
              <Badge kind={verdict.kind}>{verdict.label}</Badge>
              <Text as="span" size="2xs" mono tone="faint" uppercase>
                {input.frequencyMhz} MHz
              </Text>
            </Row>

            <Row gap={7} wrap>
              <Metric
                label="Link margin"
                value={`${signed(result.marginDb, 1)} dB`}
                tone={
                  result.marginDb >= input.fadeMarginDb
                    ? 'live'
                    : result.marginDb >= 0
                      ? 'warn'
                      : 'dead'
                }
                size="lg"
                hint={`over ${result.sensitivityDbm} dBm sensitivity`}
              />
              <Metric
                label="Max hop"
                value={`${decimal(result.maxRangeKm)} km`}
                tone="fire"
                size="lg"
                hint="at these settings"
              />
            </Row>

            <Text size="sm" tone="muted" measure={62}>
              {verdict.copy}
            </Text>
          </Stack>
        </Box>

        <LinkProfile input={input} result={result} />

        <Box tone="surface" padding={5} radius="md">
          <Stack gap={4}>
            <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
              Budget breakdown
            </Text>
            <Stack gap={2}>
              <BudgetRow label="Free-space path loss" value={`-${decimal(result.fsplDb)} dB`} />
              <BudgetRow label="Terrain excess loss" value={`-${decimal(result.excessLossDb)} dB`} />
              <BudgetRow label="Cable and connectors" value={`-${decimal(input.cableLossDb)} dB`} />
              <BudgetRow label="Received power" value={`${decimal(result.receivedDbm)} dBm`} emphasis />
              <BudgetRow
                label="Radio horizon (4/3 earth)"
                value={`${decimal(result.radioHorizonKm)} km`}
              />
              <BudgetRow
                label="Fresnel radius at mid-path"
                value={`${decimal(result.fresnelRadiusM)} m`}
                hint="clearance you need above any obstruction"
              />
            </Stack>
          </Stack>
        </Box>

        <Box tone="fire" border={false} accent="fire" padding={5} radius="sm">
          <Stack gap={2}>
            <Text size="sm" weight={600}>
              What that buys you
            </Text>
            <Text size="sm" tone="muted" measure={64}>
              A {CORRIDOR_KM} km corridor at this hop length needs{' '}
              <Value tone="fire" size="sm">
                {nodesNeeded}
              </Value>{' '}
              Base {plural(nodesNeeded, 'node')} — about{' '}
              <Value tone="fire" size="sm">
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
        justify="between"
        gap={3}
        wrap={false}
        className={emphasis ? 'budget--emphasis' : undefined}
      >
        <Text as="span" size="sm" tone={emphasis ? 'default' : 'muted'} weight={emphasis ? 600 : 400}>
          {label}
        </Text>
        <Value tone={emphasis ? 'fire' : 'muted'} size="sm" weight={emphasis ? 600 : 500}>
          {value}
        </Value>
      </Row>
      {hint ? (
        <Text size="2xs" tone="faint">
          {hint}
        </Text>
      ) : null}
    </Stack>
  )
}

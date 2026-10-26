import { useMemo, useState } from 'react'

import { SegmentedField } from '@components/shared/forms/ChoiceFields'
import { NumberField, SelectField } from '@components/shared/forms/NumericFields'
import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { satelliteModeContent as copy } from '@core/content/build/satellite/panels/mode'
import {
    fixedModeCommand,
    modeCommand,
    rangeModeCommand,
    rangeScanEstimate,
} from '@core/satellite/commands'
import type { RangeCommandOptions, SatelliteMode } from '@core/satellite/commands'
import { latest, numberField, satelliteProfiles, textField } from '@core/satellite/records'
import type { ReceiverLog } from '@core/satellite/records'

const MODES: readonly { readonly value: SatelliteMode; readonly label: string }[] = [
    { value: 'auto', label: copy.modes.auto },
    { value: 'fixed', label: copy.modes.fixed },
    { value: 'scan', label: copy.modes.scan },
    { value: 'range', label: copy.modes.range },
]
const BANDWIDTHS = [62.5, 125, 250] as const
const SPREADING_FACTORS = [7, 8, 9, 10, 11, 12] as const
const CAD_SYMBOLS = [1, 2, 4, 8, 16] as const

function durationLabel(milliseconds: number): string {
    const seconds = Math.ceil(milliseconds / 1000)
    return seconds < 60 ? `${String(seconds)} s` : `${String(Math.ceil(seconds / 60))} min`
}

function toggleNumber(values: readonly number[], value: number): readonly number[] {
    return values.includes(value)
        ? values.filter((current) => current !== value)
        : [...values, value].toSorted((a, b) => a - b)
}

function SignalStage({
    label,
    statusText,
    kind,
}: {
    readonly label: string
    readonly statusText: string
    readonly kind: 'live' | 'warn' | 'neutral'
}) {
    return (
        <Stack gap={1}>
            <Text size='2xs' tone='faint'>
                {label}
            </Text>
            <Badge kind={kind} size='xs'>
                {statusText}
            </Badge>
        </Stack>
    )
}

export function ModePanel({
    log,
    connected,
    supported,
    send,
}: {
    readonly log: ReceiverLog
    readonly connected: boolean
    readonly supported: boolean
    readonly send: (command: string) => Promise<void>
}) {
    const profiles = satelliteProfiles(log)
    const modeEntry = latest(log, 'mode')
    const statusEntry = latest(log, 'status')
    const observed =
        textField(modeEntry?.fields ?? {}, 'mode') ?? textField(statusEntry?.fields ?? {}, 'mode')
    const selectedMode: SatelliteMode =
        MODES.find(({ value }) => value === observed)?.value ?? 'auto'
    const [mode, setMode] = useState<SatelliteMode>(selectedMode)
    const observedProfile = textField(modeEntry?.fields ?? {}, 'profile')
    const [profileId, setProfileId] = useState(observedProfile ?? profiles[0]?.id ?? 'coconut')
    const [startMHz, setStartMHz] = useState(435)
    const [endMHz, setEndMHz] = useState(438)
    const [bandwidthsKHz, setBandwidthsKHz] = useState<readonly number[]>([62.5, 125])
    const [spreadingFactors, setSpreadingFactors] = useState<readonly number[]>([
        7, 8, 9, 10, 11, 12,
    ])
    const [cadSymbols, setCadSymbols] = useState(4)
    const [rxTimeoutMs, setRxTimeoutMs] = useState(22_000)
    const [commandError, setCommandError] = useState(false)
    const options = useMemo(
        () =>
            profiles.map((profile) => ({
                value: profile.id,
                label: `${profile.name} · ${profile.id}`,
            })),
        [profiles]
    )
    const estimateOptions: RangeCommandOptions = {
        startMHz,
        endMHz,
        bandwidthsKHz,
        spreadingFactors,
        cadSymbols,
        rxTimeoutMs,
    }
    let estimate = { combinations: 0, durationMs: 0 }
    try {
        estimate = rangeScanEstimate(estimateOptions)
    } catch {
        // Invalid draft fields stay visible; validation happens when the command is sent.
    }
    const estimateText = copy.estimate.replaceAll(/\{count\}|\{duration\}/gu, (placeholder) =>
        placeholder === '{count}'
            ? String(estimate.combinations)
            : durationLabel(estimate.durationMs)
    )
    const lastCadResult = textField(latest(log, 'cad')?.fields ?? {}, 'result')
    const lastPacketStatus = numberField(latest(log, 'pkt')?.fields ?? {}, 'st')
    const cadDetected = ['detected', 'pkt'].includes(lastCadResult ?? '')
    const packetDecoded = lastPacketStatus === 0

    const start = async (nextMode = mode) => {
        setCommandError(false)
        try {
            if (nextMode === 'auto' || nextMode === 'scan') await send(modeCommand(nextMode))
            else if (nextMode === 'fixed') await send(fixedModeCommand(profileId))
            else await send(rangeModeCommand(estimateOptions))
        } catch {
            setCommandError(true)
        }
    }

    return (
        <Box padding={4} radius='md' tone='surface' className='satellite_panel'>
            <Stack gap={3}>
                <Text size='lg' weight={600}>
                    {copy.title}
                </Text>
                {supported ? null : (
                    <Text size='sm' tone='faint'>
                        {copy.unsupported}
                    </Text>
                )}
                <SegmentedField
                    label={copy.title}
                    value={mode}
                    options={MODES}
                    onChange={(next) => {
                        setMode(next)
                        if (next === 'auto' || next === 'scan') void start(next)
                    }}
                />
                <Grid minColumnWidth={150} gap={3}>
                    <SignalStage
                        label={copy.cadDetected}
                        kind={cadDetected ? 'live' : 'neutral'}
                        statusText={
                            cadDetected ? copy.stageStatus.observed : copy.stageStatus.notYet
                        }
                    />
                    <SignalStage
                        label={copy.decoded}
                        kind={packetDecoded ? 'live' : 'neutral'}
                        statusText={
                            packetDecoded ? copy.stageStatus.observed : copy.stageStatus.notYet
                        }
                    />
                    <SignalStage
                        label={copy.identified}
                        kind='warn'
                        statusText={copy.stageStatus.unconfirmed}
                    />
                </Grid>
                <Text size='xs' tone='faint'>
                    {copy.identificationNote}
                </Text>
                {mode === 'fixed' ? (
                    <Grid minColumnWidth={220} gap={3}>
                        <SelectField
                            label={copy.profile}
                            value={profileId}
                            options={options}
                            onChange={setProfileId}
                        />
                        <Button
                            disabled={!connected || !supported || profiles.length === 0}
                            onClick={() => void start('fixed')}
                        >
                            {copy.modes.fixed}
                        </Button>
                    </Grid>
                ) : null}
                {mode === 'range' ? (
                    <Stack gap={3}>
                        <Grid minColumnWidth={150} gap={3}>
                            <NumberField
                                label={copy.range.start}
                                min={435}
                                max={438}
                                step={0.000001}
                                suffix='MHz'
                                value={startMHz}
                                onChange={setStartMHz}
                            />
                            <NumberField
                                label={copy.range.end}
                                min={435}
                                max={438}
                                step={0.000001}
                                suffix='MHz'
                                value={endMHz}
                                onChange={setEndMHz}
                            />
                        </Grid>
                        <Stack gap={2}>
                            <Text size='2xs' tone='faint' uppercase weight={600}>
                                {copy.range.bandwidth}
                            </Text>
                            <Row gap={2}>
                                {BANDWIDTHS.map((value) => (
                                    <Button
                                        key={value}
                                        size='sm'
                                        variant={
                                            bandwidthsKHz.includes(value) ? 'primary' : 'secondary'
                                        }
                                        pressed={bandwidthsKHz.includes(value)}
                                        onClick={() => {
                                            setBandwidthsKHz(toggleNumber(bandwidthsKHz, value))
                                        }}
                                    >
                                        {String(value)} kHz
                                    </Button>
                                ))}
                            </Row>
                        </Stack>
                        <Stack gap={2}>
                            <Text size='2xs' tone='faint' uppercase weight={600}>
                                {copy.range.sf}
                            </Text>
                            <Row gap={2}>
                                {SPREADING_FACTORS.map((value) => (
                                    <Button
                                        key={value}
                                        size='sm'
                                        variant={
                                            spreadingFactors.includes(value)
                                                ? 'primary'
                                                : 'secondary'
                                        }
                                        pressed={spreadingFactors.includes(value)}
                                        onClick={() => {
                                            setSpreadingFactors(
                                                toggleNumber(spreadingFactors, value)
                                            )
                                        }}
                                    >
                                        SF{String(value)}
                                    </Button>
                                ))}
                            </Row>
                        </Stack>
                        <Grid minColumnWidth={150} gap={3}>
                            <SelectField
                                label={copy.range.cad}
                                value={String(cadSymbols)}
                                options={CAD_SYMBOLS.map((value) => ({
                                    value: String(value),
                                    label: `${String(value)} symbols`,
                                }))}
                                onChange={(value) => {
                                    setCadSymbols(Number(value))
                                }}
                            />
                            <NumberField
                                label={copy.range.timeout}
                                min={1}
                                max={22_000}
                                step={100}
                                suffix='ms'
                                value={rxTimeoutMs}
                                onChange={setRxTimeoutMs}
                            />
                        </Grid>
                        <Text size='sm' tone='muted'>
                            {estimateText}
                        </Text>
                        <Button
                            disabled={!connected || !supported}
                            onClick={() => void start('range')}
                        >
                            {copy.start}
                        </Button>
                    </Stack>
                ) : null}
                {mode === 'auto' ? null : (
                    <Text size='xs' tone='warn'>
                        {copy.manualWarning}
                    </Text>
                )}
                {commandError ? (
                    <Text size='xs' tone='dead'>
                        {copy.commandFailed}
                    </Text>
                ) : null}
            </Stack>
        </Box>
    )
}

import type { ReactNode } from 'react'

import { Age, Timestamp } from '@components/pages/build/nearby/Indicators'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Pressable } from '@components/shared/primitives/Pressable'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Metric } from '@components/shared/widgets/Badge'
import { nearbyDetailsContent as copy } from '@core/content/build/nearby/deviceDetails'
import { sensorGuideContent as guide } from '@core/content/build/nearby/sensorGuide'
import { cx } from '@core/format/cx'
import { plural } from '@core/format/format'
import { toneSegments } from '@core/format/tones'
import {
    batteryCharge,
    batteryTone,
    bestLink,
    duration,
    EXPECTED_SENSOR_METRICS,
    formatNumber,
    metricLabel,
    metricStats,
    metricValue,
    readingValue,
    SIGNAL_TONE,
    signedChange,
    signalQuality,
    trend,
    voltageTrend,
} from '@core/nearby/metrics'
import type { MetricHistory, Rate } from '@core/nearby/metrics'
import { nodeId } from '@core/nearby/model'
import type { Device, History, Reading, Sample } from '@core/nearby/model'

type Tone = 'default' | 'live' | 'warn' | 'dead' | 'muted'

function Tile({
    label,
    value,
    tone = 'default',
    size = 'lg',
    children,
}: {
    readonly label: string
    readonly value: string
    readonly tone?: Tone | undefined
    readonly size?: 'md' | 'lg' | undefined
    readonly children: ReactNode
}) {
    return (
        <Box tone='surface-2' padding={4} radius='md' className='nearby_tile'>
            <Stack gap={2}>
                <Metric label={label} value={value} tone={tone} size={size} />
                <Text as='div' size='2xs' tone='faint' clamp={2} className='nearby_tile_note'>
                    {children}
                </Text>
            </Stack>
        </Box>
    )
}

const TREND_ARROW = { rising: '↑', falling: '↓', steady: '→' } as const
const TREND_TONE = { rising: 'live', falling: 'warn', steady: 'default' } as const

/** Battery, solar charging and LoRa signal: the first things checked on a node. */
export function Vitals({ device }: { readonly device: Device }) {
    const battery = device.readings['deviceMetrics.batteryLevel']
    const voltage = device.readings['deviceMetrics.voltage']
    const { powered, percent } = batteryCharge(device)
    const voltageChange = voltageTrend(device)
    const voltages = device.history['deviceMetrics.voltage'] ?? []
    // Without stored history (private window, blocked site data) the latest reading still counts.
    const latestVoltage =
        voltages.at(-1) ?? (voltage ? { value: voltage.value, at: voltage.receivedAt } : undefined)
    const utilization = device.readings['deviceMetrics.channelUtilization']
    const link = bestLink(device)
    const quality = link?.snr == null ? null : signalQuality(link.snr)
    return (
        <Grid minColumnWidth={140} gap={3} className='nearby_vitals'>
            <Tile
                label={copy.battery}
                value={
                    percent === null
                        ? battery
                            ? readingValue(battery)
                            : '—'
                        : `${powered ? '≈' : ''}${String(percent)} %`
                }
                tone={percent === null ? (battery ? 'default' : 'muted') : batteryTone(percent)}
            >
                {powered ? (
                    <div className='nearby_power'>
                        {copy.externalPower}
                        {percent === null ? null : `, ${copy.byVoltage}`}
                    </div>
                ) : null}
                {voltage ? `${readingValue(voltage)} · ` : null}
                {battery ? <Age time={battery.receivedAt} /> : copy.notReported}
            </Tile>
            <Tile
                label={powered ? copy.charging : copy.solar}
                value={
                    voltageChange
                        ? `${TREND_ARROW[voltageChange.direction]} ${signedChange('deviceMetrics.voltage', voltageChange.change)}`
                        : latestVoltage
                          ? formatNumber(latestVoltage.value, 'V')
                          : '—'
                }
                tone={
                    voltageChange
                        ? TREND_TONE[voltageChange.direction]
                        : latestVoltage
                          ? 'default'
                          : 'muted'
                }
            >
                {voltageChange ? (
                    <>
                        {formatNumber(voltageChange.reference.value, 'V')} →{' '}
                        {formatNumber(voltageChange.latest.value, 'V')} {copy.voltageOver}{' '}
                        {duration(voltageChange.latest.at - voltageChange.reference.at)}
                        <div>
                            {voltages.length} {copy.voltageSaved}
                        </div>
                    </>
                ) : latestVoltage ? (
                    copy.voltageWaiting
                ) : (
                    copy.voltageNone
                )}
            </Tile>
            <Tile
                label={copy.signal}
                value={quality ? copy.quality[quality] : '—'}
                tone={quality === null ? 'muted' : SIGNAL_TONE[quality]}
            >
                {link?.snr == null ? (
                    copy.signalMissing
                ) : (
                    <>
                        SNR {formatNumber(link.snr, 'dB')}
                        {link.rssi === null
                            ? ''
                            : ` · RSSI ${formatNumber(link.rssi, 'dBm')}`} · {copy.bestLink}:{' '}
                        {link.name || link.shortName || nodeId(link.num)}
                    </>
                )}
                <div>
                    {copy.channelUse} {utilization ? readingValue(utilization) : '—'}
                </div>
            </Tile>
        </Grid>
    )
}

/** Change over the last hour; until two samples exist, says how long that takes. */
function TrendLine({
    metric,
    samples,
}: {
    readonly metric: string
    readonly samples: readonly Sample[] | undefined
}) {
    const change = trend(samples)
    return (
        <div className='nearby_tile_trend'>
            {change
                ? `${TREND_ARROW[change.direction]} ${signedChange(metric, change.change)} ${copy.voltageOver} ${duration(change.latest.at - change.reference.at)}`
                : copy.trendWaiting}
        </div>
    )
}

/** A fixed clock time: ages are shown once per sensor group, not on every tile. */
function ReadingTime({ reading }: { readonly reading: Reading }) {
    return (
        <>
            {reading.measuredAt === null ? copy.received : copy.measured}{' '}
            <Timestamp time={reading.measuredAt ?? reading.receivedAt} />
            {reading.cached ? ` · ${copy.cached}` : null}
        </>
    )
}

/** Expected sensors keep their slot while empty; anything else reported is appended. */
export function SensorGrid({
    readings,
    history,
    active,
    onSelect,
}: {
    readonly readings: readonly Reading[]
    readonly history: History
    readonly active: string
    readonly onSelect: (metric: string) => void
}) {
    const byMetric = new Map(readings.map((reading) => [reading.metric, reading]))
    const expected: ReadonlySet<string> = new Set(EXPECTED_SENSOR_METRICS)
    const metrics = [
        ...EXPECTED_SENSOR_METRICS,
        ...readings.map((reading) => reading.metric).filter((metric) => !expected.has(metric)),
    ]
    return (
        <Grid minColumnWidth={160} gap={3}>
            {metrics.map((metric) => {
                const reading = byMetric.get(metric)
                const label = metricLabel(metric)
                return (
                    <Pressable
                        key={metric}
                        role='button'
                        className='bare nearby_reading'
                        pressed={active === metric}
                        accessibleLabel={label}
                        onActivate={() => {
                            onSelect(metric)
                        }}
                    >
                        <Tile
                            label={label}
                            value={reading ? readingValue(reading) : '—'}
                            tone={reading ? 'default' : 'muted'}
                            size='md'
                        >
                            {reading ? (
                                <>
                                    <div>
                                        <ReadingTime reading={reading} />
                                    </div>
                                    <TrendLine metric={metric} samples={history[metric]} />
                                </>
                            ) : (
                                copy.notReported
                            )}
                        </Tile>
                    </Pressable>
                )
            })}
        </Grid>
    )
}

const MARK_CLASS = {
    good: 'nearby_mark_good',
    fair: 'nearby_mark_fair',
    bad: 'nearby_mark_bad',
} as const

function Toned({ text }: { readonly text: string }) {
    return toneSegments(text).map((segment) =>
        segment.tone === null ? (
            segment.text
        ) : (
            <span key={segment.start} className={MARK_CLASS[segment.tone]}>
                {segment.text}
            </span>
        )
    )
}

function StatCell({
    label,
    value,
    note,
}: {
    readonly label: string
    readonly value: string
    /** Null while there is no history: the empty block stays one line shorter. */
    readonly note: ReactNode
}) {
    return (
        <Stack gap={1}>
            <Metric
                label={label}
                value={value}
                size='sm'
                tone={value === '—' ? 'muted' : 'default'}
            />
            {note === null ? null : (
                <Text size='2xs' tone='faint' className='nearby_line'>
                    {note}
                </Text>
            )}
        </Stack>
    )
}

/**
 * Extremes, average and fastest change of the selected metric over its kept
 * history: low and falling on the left, high and rising on the right.
 */
export function MetricHistoryStats({
    metric,
    history,
}: {
    readonly metric: string
    readonly history: MetricHistory
}) {
    const stats = metricStats(history.samples)
    const labels = copy.history
    const rate = (value: Rate | null) =>
        value === null ? '—' : signedChange(metric, value.to.value - value.from.value)
    const interval = (value: Rate | null) =>
        value === null ? null : (
            <>
                {copy.voltageOver} {duration(value.to.at - value.from.at)} ·{' '}
                <Timestamp time={value.to.at} />
            </>
        )
    return (
        <Stack gap={3}>
            <Row gap={3} justify='between' wrap={false}>
                <Heading level={3} size='sm' className='nearby_line'>
                    {labels.title} · {metricLabel(metric)}
                </Heading>
                <Text mono size='xs' tone='faint' className='nearby_count'>
                    {history.samples.length}{' '}
                    {plural(history.samples.length, labels.reading, labels.readings)}
                </Text>
            </Row>
            <div className='nearby_stats'>
                <StatCell
                    label={labels.lowest}
                    value={stats ? metricValue(metric, stats.lowest.value) : '—'}
                    note={stats ? <Timestamp time={stats.lowest.at} /> : null}
                />
                <StatCell
                    label={labels.average}
                    value={stats ? metricValue(metric, Math.round(stats.average * 100) / 100) : '—'}
                    note={null}
                />
                <StatCell
                    label={labels.highest}
                    value={stats ? metricValue(metric, stats.highest.value) : '—'}
                    note={stats ? <Timestamp time={stats.highest.at} /> : null}
                />
                <StatCell
                    label={labels.fall}
                    value={rate(stats?.fastestFall ?? null)}
                    note={interval(stats?.fastestFall ?? null)}
                />
                <StatCell
                    label={labels.span}
                    value={stats ? duration(stats.to - stats.from) : '—'}
                    note={stats ? <Timestamp time={stats.from} /> : null}
                />
                <StatCell
                    label={labels.rise}
                    value={rate(stats?.fastestRise ?? null)}
                    note={interval(stats?.fastestRise ?? null)}
                />
            </div>
            <Text size='xs' tone='faint'>
                {stats ? labels.source[history.source] : labels.empty}
            </Text>
        </Stack>
    )
}

/** Every entry is laid out in the same cell, so the block keeps the tallest one's height. */
export function SensorGuide({ active }: { readonly active: string }) {
    const entries = Object.entries(guide.entries)
    const known = entries.some(([metric]) => metric === active)
    const slots = [...entries, ['', guide.unknown] as const]
    return (
        <div className='nearby_guide'>
            {slots.map(([metric, entry]) => {
                const shown = metric === (known ? active : '')
                return (
                    <div
                        key={metric || 'unknown'}
                        className={cx('nearby_guide_entry', !shown && 'nearby_guide_hidden')}
                        aria-hidden={!shown}
                    >
                        <Stack gap={4}>
                            <Stack gap={2}>
                                <Heading level={3} size='sm'>
                                    {entry.title}
                                </Heading>
                                <Text size='sm' tone='muted'>
                                    {entry.summary}
                                </Text>
                            </Stack>
                            {entry.rows.length > 0 ? (
                                <Grid columns={3} minColumnWidth={200} gap={4}>
                                    {entry.rows.map((row) => (
                                        <Stack key={row.term} gap={1}>
                                            <Text
                                                size='2xs'
                                                mono
                                                uppercase
                                                weight={600}
                                                tone='faint'
                                            >
                                                {row.term}
                                            </Text>
                                            <Text size='sm'>
                                                <Toned text={row.value} />
                                            </Text>
                                        </Stack>
                                    ))}
                                </Grid>
                            ) : null}
                        </Stack>
                    </div>
                )
            })}
        </div>
    )
}

export function ReadingList({ readings }: { readonly readings: readonly Reading[] }) {
    return (
        <DescriptionList columns={1}>
            {readings.map((reading) => (
                <DescriptionItem key={reading.metric} term={metricLabel(reading.metric)}>
                    {readingValue(reading)}{' '}
                    <Text as='span' size='2xs' tone='faint'>
                        · <ReadingTime reading={reading} />
                    </Text>
                </DescriptionItem>
            ))}
        </DescriptionList>
    )
}

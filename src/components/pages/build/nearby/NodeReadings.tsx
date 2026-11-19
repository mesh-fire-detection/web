import type { ReactNode } from 'react'

import { Age, SensorStatus, Timestamp } from '@components/pages/build/nearby/Indicators'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Pressable } from '@components/shared/primitives/Pressable'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Metric } from '@components/shared/widgets/Badge'
import { LineChart, Sparkline } from '@components/shared/widgets/LineChart'
import type { Power } from '@core/api/nodes'
import { nearbyDetailsContent as copy } from '@core/content/build/nearby/nodeDetails'
import { sensorGuideContent as guide } from '@core/content/build/nearby/sensorGuide'
import { cx } from '@core/format/cx'
import { plural } from '@core/format/format'
import { toneSegments } from '@core/format/tones'
import {
    averageRate,
    batteryCharge,
    batteryFromVoltage,
    batteryTone,
    bestLink,
    duration,
    EXPECTED_SENSOR_METRICS,
    formatNumber,
    hasBattery,
    historyValue,
    isSensorMetric,
    localTime,
    metricLabel,
    metricRank,
    metricStats,
    metricValue,
    POWER_METRICS,
    readingValue,
    SIGNAL_TONE,
    signedChange,
    signalQuality,
    trend,
} from '@core/nearby/metrics'
import type { MetricHistory, Rate } from '@core/nearby/metrics'
import { meshId } from '@core/nearby/model'
import type { NearbyNode, Reading, Sample } from '@core/nearby/model'

type Tone = 'default' | 'live' | 'warn' | 'dead' | 'muted'

function Tile({
    label,
    value,
    tone = 'default',
    size = 'lg',
    spark,
    children,
}: {
    readonly label: string
    readonly value: string
    readonly tone?: Tone | undefined
    readonly size?: 'md' | 'lg' | undefined
    /** History drawn small under the note: a tile with one shows it can be charted. */
    readonly spark?: readonly Sample[] | undefined
    readonly children: ReactNode
}) {
    return (
        <Box tone='surface-2' padding={4} radius='md' className='nearby_tile'>
            <Stack gap={2}>
                <Metric label={label} value={value} tone={tone} size={size} />
                <Text as='div' size='2xs' tone='faint' clamp={2} className='nearby_tile_note'>
                    {children}
                </Text>
                {spark === undefined ? null : <Sparkline points={spark} />}
            </Stack>
        </Box>
    )
}

const TREND_ARROW = { rising: '↑', falling: '↓', steady: '→' } as const

/** Best direct LoRa link and channel use. Only a connected browser hears the radio's neighbours. */
export function SignalTile({ node }: { readonly node: NearbyNode }) {
    const utilization = node.readings['deviceMetrics.channelUtilization']
    const link = bestLink(node)
    const quality = link?.snr == null ? null : signalQuality(link.snr)
    return (
        <Grid minColumnWidth={140} gap={3} className='nearby_vitals'>
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
                        {link.name || link.shortName || meshId(link.num)}
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
        <Text as='div' size='inherit' tone='muted'>
            {change
                ? `${TREND_ARROW[change.direction]} ${signedChange(metric, change.change)} ${copy.voltageOver} ${duration(change.latest.at - change.reference.at)}`
                : copy.trendWaiting}
        </Text>
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

type Picker = {
    readonly active: string
    readonly onSelect: (metric: string) => void
}

/** Any reading: a button that shows its history in the panel below. */
function Pick({
    metric,
    active,
    onSelect,
    children,
}: Picker & { readonly metric: string; readonly children: ReactNode }) {
    return (
        <Pressable
            className='bare nearby_reading'
            pressed={active === metric}
            accessibleLabel={metricLabel(metric)}
            onActivate={() => {
                onSelect(metric)
            }}
        >
            {children}
        </Pressable>
    )
}

/** The server's word on power, so the tile agrees with the node's Power line. */
function ServerBatteryTile({ node, power }: { readonly node: NearbyNode; readonly power: Power }) {
    const metric = 'deviceMetrics.batteryLevel'
    const value =
        power.battery === 'none'
            ? copy.panel.noBattery
            : power.batteryPct === null
              ? '—'
              : `${String(power.batteryPct)} %`
    return (
        <Tile
            label={copy.battery}
            value={value}
            tone={
                power.batteryPct === null || power.battery === 'none'
                    ? 'muted'
                    : power.battery === 'low'
                      ? 'dead'
                      : batteryTone(power.batteryPct)
            }
            size='md'
            spark={node.history[metric] ?? []}
        >
            {power.pluggedIn ? (
                <Text as='span' size='inherit' tone='inherit' weight={600}>
                    {copy.externalPower}
                    {power.at === null ? null : ' · '}
                </Text>
            ) : null}
            {power.at === null ? null : <Age time={Date.parse(power.at)} />}
        </Tile>
    )
}

/** Charge, or `No battery` when the voltage says none is connected. */
function BatteryTile({ node }: { readonly node: NearbyNode }) {
    const metric = 'deviceMetrics.batteryLevel'
    const battery = node.readings[metric]
    const voltage = node.readings['deviceMetrics.voltage']
    const { powered, percent } = batteryCharge(node)
    const missing = voltage !== undefined && !hasBattery(voltage.value)
    const value = missing
        ? copy.panel.noBattery
        : percent === null
          ? battery
              ? readingValue(battery)
              : '—'
          : `${powered ? '≈' : ''}${String(percent)} %`
    return (
        <Tile
            label={copy.battery}
            value={value}
            tone={missing || percent === null ? 'muted' : batteryTone(percent)}
            size='md'
            spark={node.history[metric] ?? []}
        >
            {powered ? (
                <Text as='span' size='inherit' tone='inherit' weight={600}>
                    {copy.externalPower}
                    {percent === null || missing ? null : `, ${copy.byVoltage}`}
                    {battery ? ' · ' : null}
                </Text>
            ) : null}
            {battery ? <Age time={battery.receivedAt} /> : copy.notReported}
        </Tile>
    )
}

/** The battery's voltage and the charge it stands for, with its trend. */
function VoltageTile({ node }: { readonly node: NearbyNode }) {
    const metric = 'deviceMetrics.voltage'
    const samples = node.history[metric] ?? []
    const reading = node.readings[metric]
    const latest = samples.at(-1)?.value ?? reading?.value
    const missing = latest !== undefined && !hasBattery(latest)
    const percent = latest === undefined ? null : batteryFromVoltage(latest)
    return (
        <Tile
            label={metricLabel(metric)}
            value={latest === undefined || missing ? '—' : formatNumber(latest, 'V')}
            tone={latest === undefined || missing ? 'muted' : 'default'}
            size='md'
            spark={samples}
        >
            {latest === undefined ? (
                copy.notReported
            ) : missing ? (
                copy.panel.noBatteryNote
            ) : (
                <>
                    <div>
                        {percent === null ? null : `≈ ${String(percent)} % · `}
                        {reading ? <Age time={reading.receivedAt} /> : null}
                    </div>
                    <TrendLine metric={metric} samples={samples} />
                </>
            )}
        </Tile>
    )
}

function SensorTile({ node, metric }: { readonly node: NearbyNode; readonly metric: string }) {
    const reading = node.readings[metric]
    const samples = node.history[metric] ?? []
    const last = samples.at(-1)
    return (
        <Tile
            label={metricLabel(metric)}
            value={reading ? readingValue(reading) : last ? metricValue(metric, last.value) : '—'}
            tone={reading || last ? 'default' : 'muted'}
            size='md'
            spark={samples}
        >
            {reading ? (
                <>
                    <div>
                        <ReadingTime reading={reading} />
                    </div>
                    <TrendLine metric={metric} samples={samples} />
                </>
            ) : last ? (
                <Timestamp time={last.at} />
            ) : (
                copy.notReported
            )}
        </Tile>
    )
}

const SENSOR_GROUPS = [
    { group: 'environment', prefix: 'environmentMetrics.' },
    { group: 'particles', prefix: 'airQualityMetrics.' },
] as const

const seen = (node: NearbyNode, metric: string) =>
    node.readings[metric] !== undefined || (node.history[metric]?.length ?? 0) > 0

/** What a sensor group reported: its usual readings in their fixed order, then any others. */
function groupMetrics(node: NearbyNode, prefix: string): string[] {
    const expected: readonly string[] = EXPECTED_SENSOR_METRICS.filter((metric) =>
        metric.startsWith(prefix)
    )
    const extra = [...new Set([...Object.keys(node.readings), ...Object.keys(node.history)])]
        .filter((metric) => metric.startsWith(prefix) && isSensorMetric(metric))
        .filter((metric) => !expected.includes(metric))
        .toSorted((a, b) => metricRank(a) - metricRank(b) || a.localeCompare(b))
    return [...expected, ...extra].filter((metric) => seen(node, metric))
}

function Group({ title, children }: { readonly title: ReactNode; readonly children: ReactNode }) {
    return (
        <Stack gap={3}>
            {title}
            {children}
        </Stack>
    )
}

function GroupTitle({ children }: { readonly children: string }) {
    return (
        <Text as='div' size='sm' weight={600}>
            {children}
        </Text>
    )
}

/**
 * The readings a node has reported, sensors first and power after, as tiles
 * that each open their history in the chart at the bottom. Nothing is shown
 * for a reading the node never sent. `showStatus`, for a live connection,
 * keeps each sensor's status line even before it reports, so a missing
 * sensor can be diagnosed.
 */
export function ReadingsPanel({
    node,
    history,
    active,
    onSelect,
    title,
    headingLevel = 2,
    showStatus = false,
    power,
    footnote,
}: Picker & {
    readonly node: NearbyNode
    /** The selected metric's history. */
    readonly history: MetricHistory
    readonly title: string
    readonly headingLevel?: 2 | 3
    /** Live sensor status per group, for a node this browser is connected to. */
    readonly showStatus?: boolean
    /** What the server worked out about power, for a node's page; /connect reads its own. */
    readonly power?: Power | null
    readonly footnote?: ReactNode
}) {
    const picker = { active, onSelect }
    const sensors = SENSOR_GROUPS.map(({ group, prefix }) => ({
        group,
        metrics: groupMetrics(node, prefix),
    }))
    const powerMetrics = POWER_METRICS.filter((metric) => seen(node, metric))
    const anything = powerMetrics.length > 0 || sensors.some(({ metrics }) => metrics.length > 0)
    return (
        <Box tone='surface' padding={5} radius='md'>
            <Stack gap={5}>
                <Stack gap={1}>
                    <Heading level={headingLevel} size='sm'>
                        {title}
                    </Heading>
                    <Text size='sm' tone='muted'>
                        {anything ? copy.panel.pick : copy.panel.groupEmpty}
                    </Text>
                </Stack>
                {sensors.map(({ group, metrics }) =>
                    !showStatus && metrics.length === 0 ? null : (
                        <Group
                            key={group}
                            title={
                                showStatus ? (
                                    <SensorStatus node={node} group={group} />
                                ) : (
                                    <GroupTitle>{copy.sensors[group]}</GroupTitle>
                                )
                            }
                        >
                            {metrics.length === 0 ? null : (
                                <Grid minColumnWidth={160} gap={3}>
                                    {metrics.map((metric) => (
                                        <Pick key={metric} metric={metric} {...picker}>
                                            <SensorTile node={node} metric={metric} />
                                        </Pick>
                                    ))}
                                </Grid>
                            )}
                        </Group>
                    )
                )}
                {powerMetrics.length === 0 ? null : (
                    <Group title={<GroupTitle>{copy.panel.power}</GroupTitle>}>
                        <Grid minColumnWidth={160} gap={3}>
                            {powerMetrics.map((metric) => (
                                <Pick key={metric} metric={metric} {...picker}>
                                    {metric === 'deviceMetrics.batteryLevel' ? (
                                        power === undefined || power === null ? (
                                            <BatteryTile node={node} />
                                        ) : (
                                            <ServerBatteryTile node={node} power={power} />
                                        )
                                    ) : (
                                        <VoltageTile node={node} />
                                    )}
                                </Pick>
                            ))}
                        </Grid>
                    </Group>
                )}
                {footnote === undefined ? null : (
                    <Text size='xs' tone='faint'>
                        {footnote}
                    </Text>
                )}
                {anything ? (
                    <div className='nearby_history'>
                        <MetricHistoryStats metric={active} history={history} />
                    </div>
                ) : null}
            </Stack>
        </Box>
    )
}

const MARK_TONE = {
    good: 'liveSoft',
    fair: 'warnSoft',
    bad: 'deadSoft',
} as const

function Toned({ text }: { readonly text: string }) {
    return toneSegments(text).map((segment) =>
        segment.tone === null ? (
            segment.text
        ) : (
            <Text key={segment.start} as='span' size='inherit' tone={MARK_TONE[segment.tone]}>
                {segment.text}
            </Text>
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
                <Text size='2xs' tone='faint' truncate>
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
    const power: readonly string[] = POWER_METRICS
    const average = power.includes(metric) ? averageRate(metric, history.samples) : null
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
                <Heading level={3} size='sm' truncate>
                    {labels.title} · {metricLabel(metric)}
                </Heading>
                <Text mono size='xs' tone='faint' className='nearby_count'>
                    {history.samples.length}{' '}
                    {plural(history.samples.length, labels.reading, labels.readings)}
                </Text>
            </Row>
            {history.samples.length === 0 ? null : (
                <LineChart
                    points={history.samples}
                    label={`${labels.chart} ${metricLabel(metric)}`}
                    latestLabel={labels.latest}
                    formatValue={(value) => historyValue(metric, value)}
                    formatTime={(at) => localTime(at)}
                />
            )}
            {average === null ? null : (
                <Text size='sm'>
                    {labels.drain.over} {duration(average.spanMs)}:{' '}
                    <Text as='span' size='inherit' weight={600}>
                        {signedChange(metric, roundRate(metric, average.perDay))}{' '}
                        {labels.drain.perDay}
                    </Text>
                    {average.percent === null
                        ? null
                        : `. ${labels.drain.volts} ${signedChange('deviceMetrics.batteryLevel', roundRate('deviceMetrics.batteryLevel', average.percent.perDay))} ${labels.drain.perDay}`}
                    <DaysLeft days={(average.percent ?? average).daysLeft} />
                </Text>
            )}
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

/** How long a falling battery lasts at its average rate, ending the drain sentence. */
function DaysLeft({ days }: { readonly days: number | null }) {
    const labels = copy.history.drain
    return days === null
        ? '.'
        : `. ${labels.left} ${formatNumber(Math.round(days * 10) / 10)} ${labels.days}.`
}

/** Battery percentages to a tenth; voltage to the hundredth the node reports. */
const roundRate = (metric: string, perDay: number): number =>
    metric === 'deviceMetrics.batteryLevel'
        ? Math.round(perDay * 10) / 10
        : Math.round(perDay * 100) / 100

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

import type { NearbyNode, Peer, Reading, Sample } from '@core/nearby/model'

const METRICS: Readonly<Record<string, readonly [string, string]>> = {
    'deviceMetrics.batteryLevel': ['Battery', '%'],
    'deviceMetrics.voltage': ['Voltage', 'V'],
    'deviceMetrics.uptimeSeconds': ['Uptime', 's'],
    'environmentMetrics.temperature': ['Temperature', '°C'],
    'environmentMetrics.relativeHumidity': ['Relative humidity', '%'],
    'environmentMetrics.barometricPressure': ['Pressure', 'hPa'],
    'environmentMetrics.gasResistance': ['Gas resistance', 'kΩ'],
    'environmentMetrics.iaq': ['IAQ', ''],
    'airQualityMetrics.pm10Standard': ['PM1.0 · standard', 'µg/m³'],
    'airQualityMetrics.pm25Standard': ['PM2.5 · standard', 'µg/m³'],
    'airQualityMetrics.pm100Standard': ['PM10 · standard', 'µg/m³'],
    'airQualityMetrics.pm10Environmental': ['PM1.0', 'µg/m³'],
    'airQualityMetrics.pm25Environmental': ['PM2.5', 'µg/m³'],
    'airQualityMetrics.pm100Environmental': ['PM10', 'µg/m³'],
    // Plantower particle counts: particles at least this size in 0.1 L of air.
    'airQualityMetrics.particles03um': ['Particles ≥ 0.3 µm', '/0.1 L'],
    'airQualityMetrics.particles05um': ['Particles ≥ 0.5 µm', '/0.1 L'],
    'airQualityMetrics.particles10um': ['Particles ≥ 1 µm', '/0.1 L'],
    'airQualityMetrics.particles25um': ['Particles ≥ 2.5 µm', '/0.1 L'],
    'airQualityMetrics.particles50um': ['Particles ≥ 5 µm', '/0.1 L'],
    'airQualityMetrics.particles100um': ['Particles ≥ 10 µm', '/0.1 L'],
    'deviceMetrics.channelUtilization': ['Channel utilization', '%'],
    'deviceMetrics.airUtilTx': ['Transmit airtime', '%'],
    'powerMetrics.ch1Voltage': ['Power monitor ch1 voltage', 'V'],
    'powerMetrics.ch1Current': ['Power monitor ch1 current', 'mA'],
    'powerMetrics.ch2Voltage': ['Power monitor ch2 voltage', 'V'],
    'powerMetrics.ch2Current': ['Power monitor ch2 current', 'mA'],
    'powerMetrics.ch3Voltage': ['Power monitor ch3 voltage', 'V'],
    'powerMetrics.ch3Current': ['Power monitor ch3 current', 'mA'],
}

/**
 * What a sensor node built from the BOM reports: BME680 and PMSA003I. These
 * tiles are always shown, so arriving packets fill slots instead of moving them.
 */
export const EXPECTED_SENSOR_METRICS = [
    'environmentMetrics.temperature',
    'environmentMetrics.relativeHumidity',
    'environmentMetrics.barometricPressure',
    'environmentMetrics.gasResistance',
    'environmentMetrics.iaq',
    'airQualityMetrics.pm10Environmental',
    'airQualityMetrics.pm25Environmental',
    'airQualityMetrics.pm100Environmental',
] as const

/** Readings promoted to the summary tiles, so the detail lists skip them. */
export const SUMMARY_METRICS: ReadonlySet<string> = new Set([
    'deviceMetrics.batteryLevel',
    'deviceMetrics.voltage',
    'deviceMetrics.channelUtilization',
])

export type Trend = {
    readonly direction: 'rising' | 'falling' | 'steady'
    readonly latest: Sample
    readonly reference: Sample
    /** Change at the same 0.01 precision as the display. */
    readonly change: number
}

/** How far back a trend looks: long enough to see past measurement noise. */
const TREND_WINDOW_MS = 60 * 60 * 1000

/** Compares the newest sample with the oldest one inside the last hour. */
export function trend(samples: readonly Sample[] | undefined): Trend | null {
    const latest = samples?.at(-1)
    const reference = samples?.find(
        (sample) =>
            sample !== latest && latest !== undefined && latest.at - sample.at <= TREND_WINDOW_MS
    )
    if (!latest || !reference) return null
    const change = (Math.round(latest.value * 100) - Math.round(reference.value * 100)) / 100
    return {
        direction: change > 0 ? 'rising' : change < 0 ? 'falling' : 'steady',
        latest,
        reference,
        change,
    }
}

/** A trend's change with an explicit sign and the metric's unit, e.g. `+0.4 °C`. */
export function signedChange(metric: string, change: number): string {
    const sign = change > 0 ? '+' : change < 0 ? '−' : '±'
    return `${sign}${formatNumber(Math.abs(change), METRICS[metric]?.[1])}`
}

/** A metric's value with its unit, e.g. `23.8 °C`. */
export function metricValue(metric: string, value: number): string {
    return formatNumber(value, METRICS[metric]?.[1])
}

/** Where a metric's history came from: this browser now, the backend once it stores readings. */
type HistorySource = 'browser' | 'server'

export type MetricHistory = {
    readonly source: HistorySource
    readonly samples: readonly Sample[]
}

export type Rate = {
    /** Used only to compare interval speeds; the UI shows the observed difference. */
    readonly perHour: number
    readonly from: Sample
    readonly to: Sample
}

export type MetricStats = {
    readonly lowest: Sample
    readonly highest: Sample
    readonly average: number
    readonly fastestRise: Rate | null
    readonly fastestFall: Rate | null
    readonly from: number
    readonly to: number
}

/**
 * Neighbouring samples closer than this give noisy rates: the newest sample can
 * sit seconds after the one before it, and 0.01 of change would read as a spike.
 */
const RATE_MIN_GAP_MS = 4 * 60 * 1000

/** Battery and voltage: the readings a power test is about. */
export const POWER_METRICS = ['deviceMetrics.batteryLevel', 'deviceMetrics.voltage'] as const

/** The reading a node's history opens on: its first sensor, else its battery. */
export function defaultMetric(node: Pick<NearbyNode, 'readings' | 'history'>): string {
    const has = (metric: string) =>
        node.readings[metric] !== undefined || (node.history[metric]?.length ?? 0) > 0
    return (
        EXPECTED_SENSOR_METRICS.find((metric) => has(metric)) ??
        POWER_METRICS.find((metric) => has(metric)) ??
        EXPECTED_SENSOR_METRICS[0]
    )
}

/** Meshtastic reports a battery level above 100 when a node runs on external power. */
const POWERED_LEVEL = 100

/**
 * A value as the history shows it: `Powered` for a battery on external power,
 * and a voltage with the charge it stands for, e.g. `3.95 V (≈ 74 %)`.
 */
export function historyValue(metric: string, value: number): string {
    if (metric === 'deviceMetrics.batteryLevel' && value > POWERED_LEVEL) return 'Powered'
    const shown = metricValue(metric, value)
    if (metric !== 'deviceMetrics.voltage') return shown
    // From the voltage as shown, so two values that read the same give the same charge.
    const percent = batteryFromVoltage(Math.round(value * 100) / 100)
    return percent === null ? shown : `${shown} (≈ ${String(percent)} %)`
}

export type AverageRate = {
    /** Change per day, from a straight line through every sample. */
    readonly perDay: number
    readonly spanMs: number
    /** For a falling battery: days until it reads 0 % at this rate. */
    readonly daysLeft: number | null
    /** For voltage: the same rate in battery percent, estimated from each reading. */
    readonly percent: AverageRate | null
}

/** Below this, a battery's straight-line rate is mostly measurement noise. */
const AVERAGE_RATE_MIN_SPAN_MS = 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The overall rate of a power reading, as a least-squares slope rather than
 * first-to-last, so one noisy reading at either end does not swing it. Battery
 * readings taken on external power are left out: they say nothing about drain.
 */
export function averageRate(metric: string, samples: readonly Sample[]): AverageRate | null {
    const battery = metric === 'deviceMetrics.batteryLevel'
    const kept = battery ? samples.filter((sample) => sample.value <= POWERED_LEVEL) : samples
    const first = kept[0]
    const last = kept.at(-1)
    if (!first || !last || kept.length < 3 || last.at - first.at < AVERAGE_RATE_MIN_SPAN_MS)
        return null
    const meanAt = kept.reduce((sum, sample) => sum + (sample.at - first.at), 0) / kept.length
    const meanValue = kept.reduce((sum, sample) => sum + sample.value, 0) / kept.length
    let covariance = 0
    let variance = 0
    for (const sample of kept) {
        const at = sample.at - first.at - meanAt
        covariance += at * (sample.value - meanValue)
        variance += at * at
    }
    const perDay = (covariance / variance) * DAY_MS
    const estimated = battery
        ? []
        : kept.flatMap((sample) => {
              const percent = batteryFromVoltage(sample.value)
              return percent === null ? [] : [{ value: percent, at: sample.at }]
          })
    return {
        perDay,
        spanMs: last.at - first.at,
        daysLeft: battery && perDay < 0 ? last.value / -perDay : null,
        percent:
            metric === 'deviceMetrics.voltage'
                ? averageRate('deviceMetrics.batteryLevel', estimated)
                : null,
    }
}

export function metricStats(samples: readonly Sample[]): MetricStats | null {
    const first = samples[0]
    const last = samples.at(-1)
    if (!first || !last) return null
    let lowest = first
    let highest = first
    let total = 0
    let fastestRise: Rate | null = null
    let fastestFall: Rate | null = null
    for (const [index, sample] of samples.entries()) {
        if (sample.value < lowest.value) lowest = sample
        if (sample.value > highest.value) highest = sample
        total += sample.value
        const previous = samples[index - 1]
        if (!previous || sample.at - previous.at < RATE_MIN_GAP_MS) continue
        const perHour = ((sample.value - previous.value) * 3_600_000) / (sample.at - previous.at)
        if (perHour > 0 && perHour > (fastestRise?.perHour ?? 0))
            fastestRise = { perHour, from: previous, to: sample }
        if (perHour < 0 && perHour < (fastestFall?.perHour ?? 0))
            fastestFall = { perHour, from: previous, to: sample }
    }
    return {
        lowest,
        highest,
        average: total / samples.length,
        fastestRise,
        fastestFall,
        from: first.at,
        to: last.at,
    }
}

export function voltageTrend(node: Pick<NearbyNode, 'history'>): Trend | null {
    return trend(node.history['deviceMetrics.voltage'])
}

/**
 * Plantower's factory "standard" (CF=1) particle values are not meant for outdoor
 * air; the "atmospheric environment" ones are, so only those are sensor tiles.
 */
export function isSensorMetric(metric: string): boolean {
    return (
        metric.startsWith('environmentMetrics.') ||
        (metric.startsWith('airQualityMetrics.') && !metric.endsWith('Standard'))
    )
}

/** Where a metric sits in the list above, so related readings stay together and in size order. */
export function metricRank(metric: string): number {
    const rank = Object.keys(METRICS).indexOf(metric)
    return rank === -1 ? Infinity : rank
}

export function metricLabel(metric: string): string {
    return METRICS[metric]?.[0] ?? metric
}

export function readingValue(reading: Reading): string {
    return reading.metric === 'deviceMetrics.batteryLevel' && reading.value > 100
        ? 'Powered'
        : formatNumber(reading.value, METRICS[reading.metric]?.[1])
}

/**
 * The firmware's default LiPo open-circuit curve (`OCV_ARRAY`), in volts from 100 %
 * down to 0 % in 10 % steps. Below the last point by 0.5 V there is no battery.
 */
const OCV = [4.19, 4.05, 3.99, 3.89, 3.8, 3.72, 3.63, 3.53, 3.42, 3.3, 3.1] as const
const NO_BATTERY_VOLTS = 2.6

/**
 * Charge estimated from voltage the way the firmware does it. On external power
 * the firmware reports 101 instead of a percentage, so this is the only figure;
 * charging lifts the voltage, so it reads high while plugged in.
 */
/** False when the voltage says no battery is connected, or it is flat. */
export function hasBattery(volts: number): boolean {
    return Number.isFinite(volts) && volts >= NO_BATTERY_VOLTS
}

export function batteryFromVoltage(volts: number): number | null {
    if (!Number.isFinite(volts) || volts < NO_BATTERY_VOLTS) return null
    if (volts >= OCV[0]) return 100
    for (const [index, upper] of OCV.entries()) {
        const lower = OCV[index + 1]
        if (lower === undefined) break
        if (volts >= lower)
            return Math.round(100 - (index + (upper - volts) / (upper - lower)) * 10)
    }
    return 0
}

/**
 * The charge to show: the reported percentage, or on external power (reported as
 * 101) the one estimated from voltage. Null when neither is known.
 */
export function batteryCharge(node: Pick<NearbyNode, 'readings'>): {
    readonly powered: boolean
    readonly percent: number | null
} {
    const battery = node.readings['deviceMetrics.batteryLevel']
    if (battery === undefined) return { powered: false, percent: null }
    const voltage = node.readings['deviceMetrics.voltage']
    return battery.value <= 100
        ? { powered: false, percent: battery.value }
        : { powered: true, percent: voltage ? batteryFromVoltage(voltage.value) : null }
}

/** Green above 80 %, red below 20 %. */
export function batteryTone(percent: number): 'live' | 'dead' | 'default' {
    if (percent > 80) return 'live'
    return percent < 20 ? 'dead' : 'default'
}

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatNumber(value: number, unit = ''): string {
    // A value that rounds to zero is zero: -0.001 V reads `0 V`, not `-0 V`.
    const shown = number.format(Math.abs(value) < 0.005 ? 0 : value)
    return unit ? `${shown} ${unit}` : shown
}

export function epochTime(seconds: number, now: number): number | null {
    const time = seconds * 1000
    // With an unset RTC, Meshtastic can report uptime as a small epoch value.
    const minimumCalendarTime = Date.UTC(2000, 0, 1)
    return Number.isSafeInteger(seconds) && time >= minimumCalendarTime && time <= now ? time : null
}

const clock = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' })
const calendar = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** Local wall-clock time; the date is added only when it is not today. */
export function localTime(time: number, now = Date.now()): string {
    const sameDay = new Date(time).toDateString() === new Date(now).toDateString()
    return (sameDay ? clock : calendar).format(time)
}

export function duration(milliseconds: number): string {
    const minutes = Math.max(1, Math.round(milliseconds / 60_000))
    if (minutes < 60) return `${String(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return rest === 0 ? `${String(hours)} h` : `${String(hours)} h ${String(rest)} min`
}

export function age(time: number, now: number): string {
    const seconds = Math.max(0, Math.floor((now - time) / 1000))
    // Packets arrive about once a minute; ticking seconds would only be noise.
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    return minutes < 60 ? `${String(minutes)} min ago` : `${String(Math.floor(minutes / 60))} h ago`
}

export type SignalQuality = 'good' | 'fair' | 'weak'

export const SIGNAL_TONE = { good: 'live', fair: 'warn', weak: 'dead' } as const

/** Thresholds follow the Meshtastic apps' SNR bands for LongFast-class presets. */
export function signalQuality(snr: number): SignalQuality {
    if (snr >= -7) return 'good'
    return snr >= -15 ? 'fair' : 'weak'
}

/** Direct neighbors by link quality first, then relayed nodes by hop count. */
export function nearestPeers(node: NearbyNode): readonly Peer[] {
    const rank = (peer: Peer) => peer.hopsAway ?? Infinity
    return Object.values(node.peers)
        .filter((peer) => peer.num !== node.nodeNum)
        .toSorted(
            (left, right) =>
                rank(left) - rank(right) ||
                (right.snr ?? -Infinity) - (left.snr ?? -Infinity) ||
                (right.lastPacketAt ?? right.lastHeardAt ?? 0) -
                    (left.lastPacketAt ?? left.lastHeardAt ?? 0)
        )
}

/** The strongest direct LoRa link this node has heard. */
export function bestLink(node: NearbyNode): Peer | undefined {
    return nearestPeers(node).find((peer) => peer.hopsAway === 0 && peer.snr !== null)
}

import type { Device, Peer, Reading, Sample } from '@core/nearby/model'

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

export function voltageTrend(device: Pick<Device, 'history'>): Trend | null {
    return trend(device.history['deviceMetrics.voltage'])
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

export function metricLabel(metric: string): string {
    return METRICS[metric]?.[0] ?? metric
}

export function readingValue(reading: Reading): string {
    return reading.metric === 'deviceMetrics.batteryLevel' && reading.value > 100
        ? 'External power'
        : formatNumber(reading.value, METRICS[reading.metric]?.[1])
}

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatNumber(value: number, unit = ''): string {
    return unit ? `${number.format(value)} ${unit}` : number.format(value)
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
export function nearestPeers(device: Device): readonly Peer[] {
    const rank = (peer: Peer) => peer.hopsAway ?? Infinity
    return Object.values(device.peers)
        .filter((peer) => peer.num !== device.nodeNum)
        .toSorted(
            (left, right) =>
                rank(left) - rank(right) ||
                (right.snr ?? -Infinity) - (left.snr ?? -Infinity) ||
                (right.lastPacketAt ?? right.lastHeardAt ?? 0) -
                    (left.lastPacketAt ?? left.lastHeardAt ?? 0)
        )
}

/** The strongest direct LoRa link this device has heard. */
export function bestLink(device: Device): Peer | undefined {
    return nearestPeers(device).find((peer) => peer.hopsAway === 0 && peer.snr !== null)
}

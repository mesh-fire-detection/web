import { useState, type PointerEvent } from 'react'

import { Text } from '@components/shared/typography/Text'

export type ChartPoint = { readonly value: number; readonly at: number }

/** The plot's own coordinates; the SVG stretches to the box, strokes stay 2px. */
const W = 1000
const H = 100

/**
 * A gap this many times the usual spacing breaks the line, so missing data shows
 * as missing instead of as a straight line across it. Never under 15 minutes,
 * so a few late packets do not cut it up.
 */
const GAP_FACTOR = 3
const MIN_GAP_MS = 15 * 60 * 1000

function usualSpacing(points: readonly ChartPoint[]): number {
    const gaps = points
        .slice(1)
        .map((point, index) => point.at - (points[index]?.at ?? point.at))
        .toSorted((a, b) => a - b)
    return gaps[Math.floor(gaps.length / 2)] ?? 0
}

function nearestIndex(points: readonly ChartPoint[], at: number): number {
    let best = 0
    for (const [index, point] of points.entries()) {
        if (Math.abs(point.at - at) < Math.abs((points[best]?.at ?? 0) - at)) best = index
    }
    return best
}

/**
 * One series over time, oldest on the left. Points are expected oldest first.
 * The readout above names the latest point, or the one under the pointer.
 */
export function LineChart({
    points,
    label,
    latestLabel,
    formatValue,
    formatTime,
}: {
    readonly points: readonly ChartPoint[]
    /** What the chart shows, for screen readers. */
    readonly label: string
    readonly latestLabel: string
    readonly formatValue: (value: number) => string
    readonly formatTime: (at: number) => string
}) {
    const [hovered, setHovered] = useState<number | null>(null)
    const first = points[0]
    const last = points.at(-1)
    if (!first || !last) return null

    const values = points.map((point) => point.value)
    const lowest = Math.min(...values)
    const highest = Math.max(...values)
    const flat = highest === lowest
    const bottom = flat ? lowest - 1 : lowest
    const top = flat ? highest + 1 : highest
    const span = last.at - first.at
    const x = (at: number) => (span === 0 ? W / 2 : ((at - first.at) / span) * W)
    const y = (value: number) => H - ((value - bottom) / (top - bottom)) * H

    const breakAfter = Math.max(usualSpacing(points) * GAP_FACTOR, MIN_GAP_MS)
    const line = points
        .map((point, index) => {
            const previous = points[index - 1]
            const starts = previous === undefined || point.at - previous.at > breakAfter
            const next = points[index + 1]
            const alone = starts && (next === undefined || next.at - point.at > breakAfter)
            const at = `${x(point.at).toFixed(1)} ${y(point.value).toFixed(2)}`
            // A point with no neighbour is drawn as a dot: a zero-length round-capped stroke.
            return alone ? `M ${at} l 0 0` : `${starts ? 'M' : 'L'} ${at}`
        })
        .join(' ')

    const shown = hovered === null ? last : (points[hovered] ?? last)
    const track = (event: PointerEvent<HTMLDivElement>) => {
        const box = event.currentTarget.getBoundingClientRect()
        const fraction = box.width === 0 ? 1 : (event.clientX - box.left) / box.width
        const clamped = Math.min(1, Math.max(0, fraction))
        setHovered(nearestIndex(points, first.at + clamped * span))
    }

    return (
        <div className='line_chart'>
            <Text as='div' size='xs' tone='muted' mono className='line_chart_readout'>
                {hovered === null ? `${latestLabel} ` : null}
                {formatValue(shown.value)} · {formatTime(shown.at)}
            </Text>
            <div className='line_chart_axis'>
                <Text as='span' size='2xs' tone='faint' mono>
                    {formatValue(highest)}
                </Text>
                {flat ? null : (
                    <Text as='span' size='2xs' tone='faint' mono>
                        {formatValue(lowest)}
                    </Text>
                )}
            </div>
            <div
                className='line_chart_plot'
                role='img'
                aria-label={label}
                onPointerMove={track}
                onPointerDown={track}
                onPointerLeave={() => {
                    setHovered(null)
                }}
            >
                <svg
                    viewBox={`0 0 ${String(W)} ${String(H)}`}
                    preserveAspectRatio='none'
                    aria-hidden='true'
                >
                    <path
                        className='line_chart_grid'
                        d={`M 0 ${y(highest).toFixed(2)} H ${String(W)} M 0 ${y(lowest).toFixed(2)} H ${String(W)}`}
                        vectorEffect='non-scaling-stroke'
                    />
                    <path className='line_chart_line' d={line} vectorEffect='non-scaling-stroke' />
                    {hovered === null ? null : (
                        <>
                            <path
                                className='line_chart_cursor'
                                d={`M ${x(shown.at).toFixed(1)} 0 V ${String(H)}`}
                                vectorEffect='non-scaling-stroke'
                            />
                            <path
                                className='line_chart_ring'
                                d={`M ${x(shown.at).toFixed(1)} ${y(shown.value).toFixed(2)} l 0 0`}
                                vectorEffect='non-scaling-stroke'
                            />
                            <path
                                className='line_chart_dot'
                                d={`M ${x(shown.at).toFixed(1)} ${y(shown.value).toFixed(2)} l 0 0`}
                                vectorEffect='non-scaling-stroke'
                            />
                        </>
                    )}
                </svg>
            </div>
            <div className='line_chart_times'>
                <Text as='span' size='2xs' tone='faint' mono>
                    {formatTime(first.at)}
                </Text>
                <Text as='span' size='2xs' tone='faint' mono>
                    {formatTime(last.at)}
                </Text>
            </div>
        </div>
    )
}

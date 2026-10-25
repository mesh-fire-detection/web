import type { ReactNode } from 'react'

import { Box, Row } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'

export type StatusKind = 'live' | 'warn' | 'dead' | 'fire' | 'neutral'

export function Badge({
    children,
    kind = 'neutral',
    size = 'sm',
    mono = true,
    uppercase = true,
}: {
    children: ReactNode
    kind?: StatusKind | undefined
    size?: 'xs' | 'sm' | undefined
    mono?: boolean | undefined
    uppercase?: boolean | undefined
}) {
    return (
        <Text
            as='span'
            className={cx('badge', `badge_${kind}`, size === 'xs' && 'badge_xs')}
            mono={mono}
            size={size === 'xs' ? '2xs' : 'xs'}
            tone='inherit'
            uppercase={uppercase}
            weight={600}
        >
            {children}
        </Text>
    )
}

/** Pulsing dot for anything with an up/down state. */
export function StatusDot({ kind, pulse = false }: { kind: StatusKind; pulse?: boolean }) {
    return <span aria-hidden className={cx('dot', `dot_${kind}`, pulse && 'dot_pulse')} />
}

export function StatusLabel({
    kind,
    children,
    pulse = false,
    truncate = false,
}: {
    kind: StatusKind
    children: ReactNode
    pulse?: boolean | undefined
    truncate?: boolean | undefined
}) {
    return (
        <Row gap={2} wrap={false}>
            <StatusDot kind={kind} pulse={pulse} />
            <Text
                as='span'
                mono
                size='xs'
                tone={kind === 'neutral' ? 'faint' : kind}
                truncate={truncate}
                uppercase
                weight={600}
            >
                {children}
            </Text>
        </Row>
    )
}

/** Small key/value pair used across cards and tables. */
type MetricProps = {
    label: string
    value: ReactNode
    tone?: 'default' | 'muted' | 'faint' | 'fire' | 'live' | 'warn' | 'dead' | undefined
    hint?: string | undefined
    size?: 'sm' | 'md' | 'lg' | undefined
}

export function Metric({ label, value, tone = 'default', hint, size = 'md' }: MetricProps) {
    return (
        <div className={cx('metric', `metric_${size}`)}>
            <Text as='div' mono size='2xs' tone='faint' uppercase weight={600}>
                {label}
            </Text>
            <Text as='div' className='metric_value' mono tone={tone} weight={600}>
                {value}
            </Text>
            {hint ? (
                <Text as='div' size='2xs' tone='faint'>
                    {hint}
                </Text>
            ) : null}
        </div>
    )
}

/** Metric in a shared surface, for summary grids and compact dashboards. */
export function MetricCard(props: MetricProps) {
    return (
        <Box padding={3} radius='sm' tone='surface'>
            <Metric {...props} />
        </Box>
    )
}

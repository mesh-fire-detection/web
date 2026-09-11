import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

import { Row } from '../core/Layout'
import { Text } from '../core/Text'

export type StatusKind = 'live' | 'warn' | 'dead' | 'fire' | 'neutral'

export function Badge({
    children,
    kind = 'neutral',
    size = 'sm',
    mono = true,
}: {
    children: ReactNode
    kind?: StatusKind | undefined
    size?: 'xs' | 'sm' | undefined
    mono?: boolean | undefined
}) {
    return (
        <Text
            as='span'
            className={cx('badge', `badge_${kind}`)}
            mono={mono}
            size={size === 'xs' ? '2xs' : 'xs'}
            tone='inherit'
            uppercase
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
}: {
    kind: StatusKind
    children: ReactNode
    pulse?: boolean | undefined
}) {
    return (
        <Row gap={2} wrap={false}>
            <StatusDot kind={kind} pulse={pulse} />
            <Text
                as='span'
                mono
                size='xs'
                tone={kind === 'neutral' ? 'faint' : kind}
                uppercase
                weight={600}
            >
                {children}
            </Text>
        </Row>
    )
}

/** Small key/value pair used across cards and tables. */
export function Metric({
    label,
    value,
    tone = 'default',
    hint,
    size = 'md',
}: {
    label: string
    value: ReactNode
    tone?: 'default' | 'fire' | 'live' | 'warn' | 'dead' | 'muted' | undefined
    hint?: string | undefined
    size?: 'sm' | 'md' | 'lg' | undefined
}) {
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

import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Text } from '../core/Text'
import { Row } from '../core/Layout'

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
      as="span"
      size={size === 'xs' ? '2xs' : 'xs'}
      weight={600}
      mono={mono}
      uppercase
      tone="inherit"
      className={cx('badge', `badge--${kind}`)}
    >
      {children}
    </Text>
  )
}

/** Pulsing dot for anything with an up/down state. */
export function StatusDot({ kind, pulse = false }: { kind: StatusKind; pulse?: boolean }) {
  return <span aria-hidden className={cx('dot', `dot--${kind}`, pulse && 'dot--pulse')} />
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
      <Text as="span" size="xs" mono uppercase weight={600} tone={kind === 'neutral' ? 'faint' : kind}>
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
    <div className={cx('metric', `metric--${size}`)}>
      <Text as="div" size="2xs" tone="faint" mono uppercase weight={600}>
        {label}
      </Text>
      <Text as="div" tone={tone} mono weight={600} className="metric__value">
        {value}
      </Text>
      {hint ? (
        <Text as="div" size="2xs" tone="faint">
          {hint}
        </Text>
      ) : null}
    </div>
  )
}

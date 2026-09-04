import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export type Tone =
  | 'default'
  | 'muted'
  | 'faint'
  | 'fire'
  | 'live'
  | 'warn'
  | 'dead'
  | 'inherit'

export type TextSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'inherit'
export type TextWeight = 400 | 500 | 600 | 700
export type TextAlign = 'start' | 'center' | 'end'

type TextElement = 'p' | 'div' | 'span' | 'label' | 'figcaption' | 'dt' | 'dd' | 'li' | 'time'

export interface TextProps {
  children: ReactNode
  /** Escape hatch for semantics only. Layout still comes from props. */
  as?: TextElement | undefined
  size?: TextSize | undefined
  tone?: Tone | undefined
  weight?: TextWeight | undefined
  align?: TextAlign | undefined
  mono?: boolean | undefined
  uppercase?: boolean | undefined
  /** Caps the line length in characters for comfortable reading. */
  measure?: number | undefined
  /** Truncate to N lines with an ellipsis. */
  clamp?: number | undefined
  htmlFor?: string | undefined
  id?: string | undefined
  className?: string | undefined
}

export function Text({
  children,
  as: Component = 'p',
  size = 'md',
  tone = 'default',
  weight = 400,
  align = 'start',
  mono = false,
  uppercase = false,
  measure,
  clamp,
  htmlFor,
  id,
  className,
}: TextProps) {
  const labelProps = Component === 'label' && htmlFor !== undefined ? { htmlFor } : null

  return (
    <Component
      id={id}
      {...labelProps}
      className={cx(
        'txt',
        `txt--${size}`,
        `tone--${tone}`,
        `w--${weight}`,
        align !== 'start' && `align--${align}`,
        mono && 'txt--mono',
        uppercase && 'txt--upper',
        clamp !== undefined && 'txt--clamp',
        className,
      )}
      style={{
        ...(measure !== undefined ? { maxWidth: `${measure}ch` } : null),
        ...(clamp !== undefined ? { WebkitLineClamp: clamp } : null),
      }}
    >
      {children}
    </Component>
  )
}

export interface HeadingProps {
  children: ReactNode
  /** Document outline level. Independent of visual size. */
  level?: 1 | 2 | 3 | 4 | 5 | 6 | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | undefined
  tone?: Tone | undefined
  align?: TextAlign | undefined
  mono?: boolean | undefined
  measure?: number | undefined
  id?: string | undefined
  className?: string | undefined
}

export function Heading({
  children,
  level = 2,
  size = 'xl',
  tone = 'default',
  align = 'start',
  mono = false,
  measure,
  id,
  className,
}: HeadingProps) {
  const Component = `h${level}` as const
  return (
    <Component
      id={id}
      className={cx(
        'hd',
        `hd--${size}`,
        `tone--${tone}`,
        align !== 'start' && `align--${align}`,
        mono && 'txt--mono',
        className,
      )}
      style={measure !== undefined ? { maxWidth: `${measure}ch` } : undefined}
    >
      {children}
    </Component>
  )
}

/** Small all-caps label that sits above a heading. */
export function Eyebrow({
  children,
  tone = 'fire',
  id,
}: {
  children: ReactNode
  tone?: Tone | undefined
  id?: string | undefined
}) {
  return (
    <Text as="div" id={id} size="2xs" tone={tone} weight={600} mono uppercase className="eyebrow">
      {children}
    </Text>
  )
}

/** Inline monospace value — prices, coordinates, RSSI, part numbers. */
export function Value({
  children,
  tone = 'inherit',
  size = 'sm',
  weight = 500,
}: {
  children: ReactNode
  tone?: Tone | undefined
  size?: TextSize | undefined
  weight?: TextWeight | undefined
}) {
  return (
    <Text as="span" size={size} tone={tone} weight={weight} mono>
      {children}
    </Text>
  )
}

/** Emphasised run of text inside a sentence. */
export function Strong({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  return (
    <Text as="span" tone={tone} weight={600} size="inherit">
      {children}
    </Text>
  )
}

/** Explicit line break, so pages never reach for a bare tag. */
export function Break() {
  return <br />
}

import type { CSSProperties, ReactNode } from 'react'

import { cx } from '@core/format/cx'

export type Tone = 'default' | 'muted' | 'faint' | 'fire' | 'live' | 'warn' | 'dead' | 'inherit'

export type TextSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'inherit'
export type TextWeight = 400 | 500 | 600 | 700
type TextAlign = 'start' | 'center' | 'end'
type TextElement = 'div' | 'span'

export type TextProps = {
    children: ReactNode
    as?: TextElement | undefined
    size?: TextSize | undefined
    tone?: Tone | undefined
    weight?: TextWeight | undefined
    align?: TextAlign | undefined
    mono?: boolean | undefined
    uppercase?: boolean | undefined
    measure?: number | undefined
    clamp?: number | undefined
    htmlFor?: string | undefined
    id?: string | undefined
    className?: string | undefined
}

export function Text({
    children,
    as: Component = 'div',
    size = 'md',
    tone = 'default',
    weight = 400,
    align = 'start',
    mono = false,
    uppercase = false,
    measure,
    clamp,
    id,
    className,
}: TextProps) {
    const style: CSSProperties | undefined =
        measure === undefined && clamp === undefined
            ? undefined
            : {
                  ...(measure !== undefined && { maxWidth: `${String(measure)}ch` }),
                  ...(clamp !== undefined && { WebkitLineClamp: clamp }),
              }

    return (
        <Component
            className={cx(
                'txt',
                `txt_${size}`,
                `tone_${tone}`,
                `w_${String(weight)}`,
                align !== 'start' && `align_${align}`,
                mono && 'txt_mono',
                uppercase && 'txt_upper',
                clamp !== undefined && 'txt_clamp',
                className
            )}
            id={id}
            style={style}
        >
            {children}
        </Component>
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
        <Text as='span' mono size={size} tone={tone} weight={weight}>
            {children}
        </Text>
    )
}

/** Emphasised run of text inside a sentence. */
export function Strong({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
    return (
        <Text as='span' size='inherit' tone={tone} weight={600}>
            {children}
        </Text>
    )
}

/** Explicit line break, so pages never reach for a bare tag. */
export function Break() {
    return <div aria-hidden className='break' />
}

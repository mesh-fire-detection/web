import type { AriaRole, CSSProperties, ReactNode } from 'react'

import { cx } from '@core/format/cx'

export type Tone =
    | 'default'
    | 'muted'
    | 'faint'
    | 'fire'
    | 'live'
    | 'warn'
    | 'dead'
    | 'liveSoft'
    | 'warnSoft'
    | 'deadSoft'
    | 'inherit'

export const TEXT_TONE_CLASS: Readonly<Record<Tone, string>> = {
    default: 'tone_default',
    muted: 'tone_muted',
    faint: 'tone_faint',
    fire: 'tone_fire',
    live: 'tone_live',
    warn: 'tone_warn',
    dead: 'tone_dead',
    liveSoft: 'tone_live_soft',
    warnSoft: 'tone_warn_soft',
    deadSoft: 'tone_dead_soft',
    inherit: 'tone_inherit',
}

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
    truncate?: boolean | undefined
    htmlFor?: string | undefined
    id?: string | undefined
    ariaLive?: 'off' | 'polite' | 'assertive' | undefined
    role?: AriaRole | undefined
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
    truncate = false,
    id,
    ariaLive,
    role,
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
                TEXT_TONE_CLASS[tone],
                `w_${String(weight)}`,
                align !== 'start' && `align_${align}`,
                mono && 'txt_mono',
                uppercase && 'txt_upper',
                clamp !== undefined && 'txt_clamp',
                truncate && 'txt_truncate',
                className
            )}
            id={id}
            aria-live={ariaLive}
            role={role}
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

/** Preformatted text in a scrollable shared surface, for payloads and snippets. */
export function CodeBlock({ children }: { children: string }) {
    return (
        <pre className='code_block'>
            <code>{children}</code>
        </pre>
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

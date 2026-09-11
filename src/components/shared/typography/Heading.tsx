import type { ReactNode } from 'react'

import { Text, type Tone } from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'

type TextAlign = 'start' | 'center' | 'end'

export type HeadingProps = {
    children: ReactNode
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
    return (
        <div
            aria-level={level}
            className={cx(
                'hd',
                `hd_${size}`,
                `tone_${tone}`,
                align !== 'start' && `align_${align}`,
                mono && 'txt_mono',
                className
            )}
            id={id}
            role='heading'
            style={measure === undefined ? undefined : { maxWidth: `${String(measure)}ch` }}
        >
            {children}
        </div>
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
        <Text
            as='div'
            className='eyebrow'
            id={id}
            mono
            size='2xs'
            tone={tone}
            uppercase
            weight={600}
        >
            {children}
        </Text>
    )
}

import type { ReactNode } from 'react'

import { SectionHead } from '@components/shared/page/SectionHead'
import { Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'

/** One part of the kit: a heading, then its groups of examples. */
export function Specimen({
    title,
    lede,
    children,
}: {
    readonly title: string
    readonly lede?: string | undefined
    readonly children: ReactNode
}) {
    return (
        <Stack gap={6}>
            <SectionHead title={title} lede={lede} />
            {children}
        </Stack>
    )
}

/** A component, or one of its props, with every value it takes laid out below. */
export function Group({
    label,
    children,
}: {
    readonly label: string
    readonly children: ReactNode
}) {
    return (
        <Stack gap={3}>
            <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                {label}
            </Text>
            {children}
        </Stack>
    )
}

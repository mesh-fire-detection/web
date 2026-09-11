import type { ReactNode } from 'react'

import { Row, Stack } from '@components/shared/primitives/Layout'
import { Eyebrow, Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'

export function SectionHead({
    eyebrow,
    title,
    lede,
    action,
    id,
    size = 'xl',
}: {
    eyebrow?: string | undefined
    title: string
    lede?: string | undefined
    action?: ReactNode | undefined
    id?: string | undefined
    size?: 'lg' | 'xl' | '2xl' | undefined
}) {
    return (
        <Row justify='between' align='end' gap={5}>
            <Stack gap={3} minWidth0>
                {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
                <Heading level={2} size={size} id={id} measure={30}>
                    {title}
                </Heading>
                {lede ? (
                    <Text tone='muted' measure={76}>
                        {lede}
                    </Text>
                ) : null}
            </Stack>
            {action}
        </Row>
    )
}

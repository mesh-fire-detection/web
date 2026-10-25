import type { ReactNode } from 'react'

import { Row } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'

export function CollectionToolbar({
    children,
    resultCount,
    itemLabel,
    itemLabelPlural,
}: {
    children: ReactNode
    resultCount: number
    itemLabel: string
    itemLabelPlural?: string | undefined
}) {
    return (
        <Row className='collection_toolbar' gap={4} justify='between'>
            <Row className='collection_controls' gap={3}>
                {children}
            </Row>
            <Text ariaLive='polite' className='collection_count' mono size='xs' tone='faint'>
                {resultCount} {resultCount === 1 ? itemLabel : (itemLabelPlural ?? `${itemLabel}s`)}
            </Text>
        </Row>
    )
}

import type { ReactNode } from 'react'

import { Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'

export function StepList({ children }: { readonly children: ReactNode }) {
    return <ol className='step_list'>{children}</ol>
}

export function StepItem({
    children,
    index,
}: {
    readonly children: ReactNode
    /** One-based position in the list. */
    readonly index: number
}) {
    return (
        <li className='step_item'>
            <Row align='start' className='step_row' gap={4} wrap={false}>
                <Text as='span' className='step_number' mono size='xs' tone='fire' weight={600}>
                    {String(index).padStart(2, '0')}
                </Text>
                <Stack gap={1} grow minWidth0>
                    {children}
                </Stack>
            </Row>
        </li>
    )
}

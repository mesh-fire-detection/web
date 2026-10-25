import type { ReactNode } from 'react'

import { Row, Stack } from '@components/shared/primitives/Layout'
import { cx } from '@core/format/cx'

export type TimelineMetaWidth = 'sm' | 'md' | 'lg'

const META_CLASS: Readonly<Record<TimelineMetaWidth, string>> = {
    sm: 'timeline_meta_sm',
    md: 'timeline_meta_md',
    lg: 'timeline_meta_lg',
}

export function Timeline({ children }: { readonly children: ReactNode }) {
    return <ol className='timeline_list'>{children}</ol>
}

export function TimelineItem({
    children,
    meta,
    metaWidth = 'md',
}: {
    readonly children: ReactNode
    readonly meta: ReactNode
    readonly metaWidth?: TimelineMetaWidth | undefined
}) {
    return (
        <li className='timeline_item'>
            <Row align='start' className='timeline_row' gap={5} wrap={false}>
                <div className={cx('timeline_meta', META_CLASS[metaWidth])}>{meta}</div>
                <Stack className='timeline_content' gap={1} grow minWidth0>
                    {children}
                </Stack>
            </Row>
        </li>
    )
}

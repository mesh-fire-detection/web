import type { ReactNode } from 'react'

import { Text } from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'

export function List({
    children,
    marker = 'dash',
    gap = 2,
}: {
    children: ReactNode
    marker?: 'dash' | 'dot' | 'none' | 'number' | undefined
    gap?: 1 | 2 | 3 | 4 | undefined
}) {
    return (
        <div className={cx('list', `list_${marker}`, `gap_${String(gap)}`)} role='list'>
            {children}
        </div>
    )
}

export function ListItem({
    children,
    tone = 'muted',
    size = 'md',
}: {
    children: ReactNode
    tone?: 'default' | 'muted' | 'faint' | undefined
    size?: 'sm' | 'md' | undefined
}) {
    return (
        <div className='list_item' role='listitem'>
            <Text as='div' size={size} tone={tone}>
                {children}
            </Text>
        </div>
    )
}

/** Definition-style list for spec sheets. */
export function DescriptionList({
    children,
    columns = 2,
}: {
    children: ReactNode
    columns?: 1 | 2
}) {
    return <div className={cx('dlist', columns === 2 && 'dlist_2')}>{children}</div>
}

export function DescriptionItem({ term, children }: { term: ReactNode; children: ReactNode }) {
    return (
        <div className='dlist_row'>
            <Text as='div' mono size='xs' tone='faint' uppercase weight={600}>
                {term}
            </Text>
            <Text as='div' className='dlist_dd' size='sm' tone='default'>
                {children}
            </Text>
        </div>
    )
}

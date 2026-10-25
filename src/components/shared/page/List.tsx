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
    const Component = marker === 'number' ? 'ol' : 'ul'
    return (
        <Component className={cx('list', `list_${marker}`, `gap_${String(gap)}`)}>
            {children}
        </Component>
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
        <li className='list_item'>
            <Text as='div' size={size} tone={tone}>
                {children}
            </Text>
        </li>
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
    return <dl className={cx('dlist', columns === 2 && 'dlist_2')}>{children}</dl>
}

export function DescriptionItem({ term, children }: { term: ReactNode; children: ReactNode }) {
    return (
        <div className='dlist_row'>
            <dt>
                <Text as='span' mono size='xs' tone='faint' uppercase weight={600}>
                    {term}
                </Text>
            </dt>
            <dd className='dlist_dd'>
                <Text as='span' size='sm' tone='default'>
                    {children}
                </Text>
            </dd>
        </div>
    )
}

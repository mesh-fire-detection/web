import type { ReactNode } from 'react'

import { Heading } from '@components/shared/typography/Heading'
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

/**
 * A titled group of settings: a heading, an optional action level with it,
 * and the rows below, each set off by a rule.
 */
export function SettingList({
    title,
    action,
    children,
}: {
    title: string
    action?: ReactNode | undefined
    children: ReactNode
}) {
    return (
        <div className='setting_list'>
            <div className='setting_list_head'>
                <Heading level={2} size='md'>
                    {title}
                </Heading>
                {action}
            </div>
            {children}
        </div>
    )
}

/**
 * One setting: what it is and where it stands on the left, its value or what
 * to do about it on the right. On a phone the right side drops below.
 */
export function SettingRow({
    label,
    description,
    children,
    action,
    align = 'center',
}: {
    label?: ReactNode | undefined
    description?: ReactNode | undefined
    children?: ReactNode | undefined
    action?: ReactNode | undefined
    align?: 'center' | 'end' | undefined
}) {
    return (
        <div className={cx('setting_row', align === 'end' && 'setting_row_end')}>
            <div className='setting_row_text'>
                {label === undefined ? null : (
                    <Text as='div' weight={600}>
                        {label}
                    </Text>
                )}
                {description === undefined ? null : (
                    <Text size='sm' tone='muted'>
                        {description}
                    </Text>
                )}
                {children}
            </div>
            {action === undefined ? null : <div className='setting_row_action'>{action}</div>}
        </div>
    )
}

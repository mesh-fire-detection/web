import type { ReactNode } from 'react'

import { Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Icon, type IconName } from '@components/shared/widgets/Icon'
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

/**
 * A route read top to bottom: stops joined by a rail, each link between them
 * labelled on the rail. Children alternate `RouteStop` and `RouteLeg`.
 */
export function RouteTrail({
    children,
    label,
}: {
    readonly children: ReactNode
    /** The whole route in words, for screen readers. */
    readonly label: string
}) {
    return (
        <ol aria-label={label} className='route_trail'>
            {children}
        </ol>
    )
}

/** A place on the route. The last stop, the destination, is filled in. */
export function RouteStop({
    children,
    end = false,
}: {
    readonly children: ReactNode
    readonly end?: boolean | undefined
}) {
    return (
        <li className={cx('route_stop', end && 'route_stop_end')}>
            <span aria-hidden='true' className='route_dot' />
            <div className='route_body'>{children}</div>
        </li>
    )
}

/** The link between two stops: how the data travelled, and when it last did. */
export function RouteLeg({
    children,
    icon,
    meta,
}: {
    readonly children: ReactNode
    readonly icon?: IconName | undefined
    readonly meta?: ReactNode
}) {
    return (
        <li className='route_leg'>
            <span aria-hidden='true' className='route_rail' />
            <div className='route_body route_leg_body'>
                {icon === undefined ? null : (
                    <Text as='span' tone='faint'>
                        <Icon name={icon} size={14} />
                    </Text>
                )}
                <Text as='span' size='xs' tone='muted'>
                    {children}
                </Text>
                {meta === undefined ? null : (
                    <Text as='span' size='2xs' tone='faint'>
                        {meta}
                    </Text>
                )}
            </div>
        </li>
    )
}

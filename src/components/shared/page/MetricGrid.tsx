import type { ReactNode } from 'react'

import { cx } from '@core/format/cx'

export function MetricGrid({
    children,
    gap = 5,
    className,
}: {
    children: ReactNode
    gap?: 2 | 3 | 4 | 5 | 6 | undefined
    className?: string | undefined
}) {
    return <div className={cx('metric_grid', `gap_${String(gap)}`, className)}>{children}</div>
}

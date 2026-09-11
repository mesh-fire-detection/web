import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

import { ScrollArea } from '../core/Layout'
import { Text } from '../core/Text'

export type Column<Row> = {
    key: string
    header: ReactNode
    align?: 'start' | 'end' | undefined
    render: (row: Row, index: number) => ReactNode
}

export function DataTable<Row>({
    columns,
    rows,
    getRowKey,
    caption,
    footer,
    dense = false,
}: {
    columns: readonly Column<Row>[]
    rows: readonly Row[]
    getRowKey: (row: Row, index: number) => string
    caption?: string | undefined
    footer?: ReactNode | undefined
    dense?: boolean | undefined
}) {
    return (
        <ScrollArea label={caption}>
            <div className={cx('table', dense && 'table_dense')} role='table' aria-label={caption}>
                {caption ? (
                    <div className='table_caption' role='caption'>
                        {caption}
                    </div>
                ) : null}
                <div className='table_head' role='rowgroup'>
                    <div className='table_row' role='row'>
                        {columns.map((column) => (
                            <div
                                className={cx('table_cell', column.align === 'end' && 'align_end')}
                                key={column.key}
                                role='columnheader'
                            >
                                <Text as='span' mono size='2xs' tone='faint' uppercase weight={600}>
                                    {column.header}
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>
                <div className='table_body' role='rowgroup'>
                    {rows.map((row, index) => (
                        <div className='table_row' key={getRowKey(row, index)} role='row'>
                            {columns.map((column) => (
                                <div
                                    className={cx(
                                        'table_cell',
                                        column.align === 'end' && 'align_end'
                                    )}
                                    key={column.key}
                                    role='cell'
                                >
                                    {column.render(row, index)}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                {footer ? (
                    <div className='table_foot' role='rowgroup'>
                        <div className='table_row' role='row'>
                            <div className='table_cell' role='cell'>
                                {footer}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </ScrollArea>
    )
}

import type { ReactNode } from 'react'

import { ScrollArea, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'

export type Column<Row> = {
    key: string
    header: ReactNode
    align?: 'start' | 'end' | undefined
    sortValue?: ((row: Row) => string | number | null) | undefined
    render: (row: Row, index: number) => ReactNode
}

export function DataTable<Row>({
    columns,
    rows,
    getRowKey,
    caption,
    label = caption,
    footer,
    dense = false,
    className,
    sort,
    emptyContent,
}: {
    columns: readonly Column<Row>[]
    rows: readonly Row[]
    getRowKey: (row: Row, index: number) => string
    caption?: string | undefined
    /** Accessible name when a visible heading already titles the table. */
    label?: string | undefined
    /** Supporting content below the scrollable table. */
    footer?: ReactNode | undefined
    dense?: boolean | undefined
    className?: string | undefined
    sort?:
        | {
              key: string | null
              direction: 'ascending' | 'descending'
              onChange: (key: string) => void
          }
        | undefined
    emptyContent?: ReactNode | undefined
}) {
    return (
        <Stack gap={0}>
            <ScrollArea label={label}>
                <table
                    aria-label={label}
                    className={cx('table', dense && 'table_dense', className)}
                >
                    {caption ? <caption className='table_caption'>{caption}</caption> : null}
                    <thead className='table_head'>
                        <tr className='table_row'>
                            {columns.map((column) => (
                                <th
                                    className={cx(
                                        'table_cell',
                                        column.align === 'end' && 'align_end'
                                    )}
                                    key={column.key}
                                    aria-sort={
                                        sort?.key === column.key ? sort.direction : undefined
                                    }
                                    scope='col'
                                >
                                    {sort && column.sortValue ? (
                                        <button
                                            className='table_sort'
                                            onClick={() => {
                                                sort.onChange(column.key)
                                            }}
                                            type='button'
                                        >
                                            <Text
                                                as='span'
                                                mono
                                                size='2xs'
                                                tone='faint'
                                                uppercase
                                                weight={600}
                                            >
                                                {column.header}
                                            </Text>
                                            <span aria-hidden className='table_sort_mark'>
                                                {sort.key === column.key
                                                    ? sort.direction === 'ascending'
                                                        ? '↑'
                                                        : '↓'
                                                    : '↕'}
                                            </span>
                                        </button>
                                    ) : (
                                        <Text
                                            as='span'
                                            mono
                                            size='2xs'
                                            tone='faint'
                                            uppercase
                                            weight={600}
                                        >
                                            {column.header}
                                        </Text>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className='table_body'>
                        {rows.length === 0 ? (
                            <tr className='table_row'>
                                <td
                                    className={cx('table_cell', 'table_empty')}
                                    colSpan={columns.length}
                                >
                                    {emptyContent ?? (
                                        <Text as='span' size='sm' tone='faint'>
                                            No data available.
                                        </Text>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, index) => (
                                <tr className='table_row' key={getRowKey(row, index)}>
                                    {columns.map((column) => (
                                        <td
                                            className={cx(
                                                'table_cell',
                                                column.align === 'end' && 'align_end'
                                            )}
                                            key={column.key}
                                        >
                                            {column.render(row, index)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </ScrollArea>
            {footer ? <div className='table_footnote'>{footer}</div> : null}
        </Stack>
    )
}

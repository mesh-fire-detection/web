import type { ReactNode } from 'react'

import { ScrollArea, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'

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
    /**
     * Sits below the table rather than inside it. A CSS-table row cannot span
     * columns, so a footer row would be as wide as the first column only.
     */
    footer?: ReactNode | undefined
    dense?: boolean | undefined
}) {
    return (
        <Stack gap={0}>
            <ScrollArea label={caption}>
                <div
                    aria-label={caption}
                    className={cx('table', dense && 'table_dense')}
                    role='table'
                >
                    {caption ? (
                        <div className='table_caption' role='caption'>
                            {caption}
                        </div>
                    ) : null}
                    <div className='table_head' role='rowgroup'>
                        <div className='table_row' role='row'>
                            {columns.map((column) => (
                                <div
                                    className={cx(
                                        'table_cell',
                                        column.align === 'end' && 'align_end'
                                    )}
                                    key={column.key}
                                    role='columnheader'
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
                </div>
            </ScrollArea>
            {footer ? <div className='table_footnote'>{footer}</div> : null}
        </Stack>
    )
}

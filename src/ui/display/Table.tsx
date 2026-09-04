import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { ScrollArea } from '../core/Layout'
import { Text } from '../core/Text'

export interface Column<Row> {
  key: string
  header: ReactNode
  /** Right-align numbers, left-align everything else. */
  align?: 'start' | 'end' | undefined
  /** Fixed column width, e.g. '96px' or '30%'. */
  width?: string | undefined
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
  columns: ReadonlyArray<Column<Row>>
  rows: ReadonlyArray<Row>
  getRowKey: (row: Row, index: number) => string
  caption?: string | undefined
  footer?: ReactNode | undefined
  dense?: boolean | undefined
}) {
  return (
    <ScrollArea label={caption}>
      <table className={cx('table', dense && 'table--dense')}>
        {caption ? <caption className="table__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width !== undefined ? { width: column.width } : undefined}
                className={cx(column.align === 'end' && 'align--end')}
              >
                <Text as="span" size="2xs" mono uppercase weight={600} tone="faint">
                  {column.header}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)}>
              {columns.map((column) => (
                <td key={column.key} className={cx(column.align === 'end' && 'align--end')}>
                  {column.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer ? (
          <tfoot>
            <tr>
              <td colSpan={columns.length}>{footer}</td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </ScrollArea>
  )
}

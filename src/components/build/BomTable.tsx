import { useState } from 'react'
import {
  Badge,
  Box,
  DataTable,
  Heading,
  Metric,
  Row,
  SegmentedField,
  Stack,
  Text,
  TextLink,
  Value,
} from '@/ui'
import type { Column } from '@/ui'
import { BOMS, bomFor, bomTotal } from '@/data/bom'
import type { BomPart } from '@/data/bom'
import type { NodeType } from '@/data/network'
import { money, plural } from '@/lib/format'

const OPTIONS = BOMS.map((bom) => ({ value: bom.type, label: bom.title.replace(' node', '') }))

export function BomTable() {
  const [type, setType] = useState<NodeType>('base')
  const bom = bomFor(type)
  const total = bomTotal(bom)

  // Running total, so a reader can see where the money goes down the list.
  let running = 0
  const rows = bom.parts.map((part) => {
    running += part.unitPrice * part.quantity
    return { part, running }
  })

  type RowShape = (typeof rows)[number]

  const columns: ReadonlyArray<Column<RowShape>> = [
    {
      key: 'part',
      header: 'Part',
      render: ({ part }: { part: BomPart }) => (
        <Stack gap={1} align="start">
          <Row gap={2}>
            <TextLink to={part.url} tone="quiet" size="sm">
              {part.name}
            </TextLink>
            {part.inheritedFromBase ? <Badge size="xs">base</Badge> : null}
          </Row>
          <Text size="xs" tone="faint" measure={66}>
            {part.detail}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      width: '150px',
      render: ({ part }) => (
        <Stack gap={0} align="start">
          <Text size="xs" tone="muted">
            {part.supplier}
          </Text>
          {part.sku ? (
            <Text size="2xs" mono tone="faint">
              {part.sku}
            </Text>
          ) : null}
        </Stack>
      ),
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'end',
      width: '60px',
      render: ({ part }) => <Value tone="faint">{part.quantity}</Value>,
    },
    {
      key: 'price',
      header: 'Price',
      align: 'end',
      width: '86px',
      render: ({ part }) => <Value>{money(part.unitPrice * part.quantity)}</Value>,
    },
    {
      key: 'running',
      header: 'Running',
      align: 'end',
      width: '92px',
      render: ({ running: value }) => <Value tone="faint">{money(value)}</Value>,
    },
  ]

  return (
    <Stack gap={5}>
      <Row justify="between" align="end" gap={4}>
        <SegmentedField label="Node type" value={type} options={OPTIONS} onChange={setType} />
        <Row gap={5} wrap>
          <Metric label="Parts" value={bom.parts.length} size="sm" />
          <Metric label="Build time" value={`${bom.buildMinutes} min`} size="sm" />
          <Metric
            label="Unit cost"
            value={money(total)}
            tone="fire"
            size="lg"
            hint={bom.confidence === 'priced' ? 'Every part quoted' : 'Some parts estimated'}
          />
        </Row>
      </Row>

      <Box tone="surface" padding={0} radius="md">
        <Stack gap={0}>
          <Box tone="transparent" border={false} padding={5} radius="none">
            <Stack gap={2}>
              <Heading level={3} size="md">
                {bom.title}
              </Heading>
              <Text size="sm" tone="muted" measure={84}>
                {bom.summary}
              </Text>
            </Stack>
          </Box>

          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={({ part }) => part.name}
            footer={
              <Row justify="between" gap={3}>
                <Text size="xs" tone="faint">
                  {bom.parts.length} {plural(bom.parts.length, 'line')} · prices checked 2026-08-30 ·
                  excludes shipping and sales tax
                </Text>
                <Value tone="fire" size="md" weight={700}>
                  {money(total)}
                </Value>
              </Row>
            }
          />
        </Stack>
      </Box>
    </Stack>
  )
}

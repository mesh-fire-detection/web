import { useState } from 'react'

import type { Column } from '@components/shared/page/DataTable'
import { DataTable } from '@components/shared/page/DataTable'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text, Value } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import { Badge, Metric } from '@components/shared/widgets/Badge'
import { SegmentedField } from '@components/shared/widgets/Field'
import type { BomPart } from '@core/content/build/bom'
import { BOMS, bomFor, bomTotal } from '@core/content/build/bom'
import type { NodeType } from '@core/content/network/network'
import { money, plural } from '@core/format/format'

const OPTIONS = BOMS.map((bom) => ({ value: bom.type, label: bom.title.replace(' node', '') }))

const withRunningTotals = (
    parts: readonly BomPart[]
): readonly { part: BomPart; running: number }[] => {
    const rows: { part: BomPart; running: number }[] = []
    let running = 0
    for (const part of parts) {
        running += part.unitPrice * part.quantity
        rows.push({ part, running })
    }
    return rows
}

export function BomTable() {
    const [type, setType] = useState<NodeType>('base')
    const bom = bomFor(type)
    const total = bomTotal(bom)
    const rows = withRunningTotals(bom.parts)

    type RowShape = (typeof rows)[number]

    const columns: readonly Column<RowShape>[] = [
        {
            key: 'part',
            header: 'Part',
            render: ({ part }: { part: BomPart }) => (
                <Stack gap={1} align='start'>
                    <Row gap={2}>
                        <TextLink to={part.url} tone='quiet' size='sm'>
                            {part.name}
                        </TextLink>
                        {part.inheritedFromBase ? <Badge size='xs'>base</Badge> : null}
                    </Row>
                    <Text size='xs' tone='faint' measure={66}>
                        {part.detail}
                    </Text>
                </Stack>
            ),
        },
        {
            key: 'supplier',
            header: 'Supplier',
            render: ({ part }) => (
                <Stack gap={0} align='start'>
                    <Text size='xs' tone='muted'>
                        {part.supplier}
                    </Text>
                    {part.sku ? (
                        <Text size='2xs' mono tone='faint'>
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
            render: ({ part }) => <Value tone='faint'>{part.quantity}</Value>,
        },
        {
            key: 'price',
            header: 'Price',
            align: 'end',
            render: ({ part }) => <Value>{money(part.unitPrice * part.quantity)}</Value>,
        },
        {
            key: 'running',
            header: 'Running',
            align: 'end',
            render: ({ running: value }) => <Value tone='faint'>{money(value)}</Value>,
        },
    ]

    return (
        <Stack gap={5}>
            <Row justify='between' align='end' gap={4}>
                <SegmentedField
                    label='Node type'
                    value={type}
                    options={OPTIONS}
                    onChange={setType}
                />
                <Row gap={5} wrap>
                    <Metric label='Parts' value={bom.parts.length} size='sm' />
                    <Metric label='Build time' value={`${bom.buildMinutes} min`} size='sm' />
                    <Metric
                        label='Unit cost'
                        value={money(total)}
                        tone='fire'
                        size='lg'
                        hint={
                            bom.confidence === 'priced'
                                ? 'Every part quoted'
                                : 'Some parts estimated'
                        }
                    />
                </Row>
            </Row>

            <Box tone='surface' padding={0} radius='md'>
                <Stack gap={0}>
                    <Box tone='transparent' border={false} padding={5} radius='none'>
                        <Stack gap={2}>
                            <Heading level={3} size='md'>
                                {bom.title}
                            </Heading>
                            <Text size='sm' tone='muted' measure={84}>
                                {bom.summary}
                            </Text>
                        </Stack>
                    </Box>

                    <DataTable
                        columns={columns}
                        rows={rows}
                        getRowKey={({ part }) => part.name}
                        footer={
                            <Row justify='between' gap={3}>
                                <Text size='xs' tone='faint'>
                                    {bom.parts.length} {plural(bom.parts.length, 'line')} · prices
                                    checked 2026-08-30 · excludes shipping and sales tax
                                </Text>
                                <Value tone='fire' size='md' weight={700}>
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

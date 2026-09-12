import { useState } from 'react'

import type { Column } from '@components/shared/page/DataTable'
import { DataTable } from '@components/shared/page/DataTable'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text, Value } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import { Badge, Metric } from '@components/shared/widgets/Badge'
import { SegmentedField } from '@components/shared/widgets/Field'
import type { Basket, BomLine } from '@core/content/build/bom'
import {
    BOMS,
    bomFor,
    bomTotal,
    lineCost,
    orderCount,
    supplierBaskets,
} from '@core/content/build/bom'
import { buildContent } from '@core/content/build/content'
import { PARTS, primaryVendor, type CatalogPart } from '@core/content/build/parts'
import { storeFor, type Store } from '@core/content/build/stores'
import type { NodeType } from '@core/content/network/network'
import { money, plural } from '@core/format/format'

const OPTIONS = BOMS.map((bom) => ({ value: bom.type, label: bom.title.replace(' node', '') }))

const { orders: ordersCopy } = buildContent.bom

/** Catalogue prices are whole dollars; published shipping rates are not. */
const price = (value: number): string => money(value, !Number.isSafeInteger(value))

const fill = (template: string, amount: number): string =>
    template.split('{amount}').join(price(amount))

function shippingCaption(store: Store, subtotal: number): string {
    const { shipping } = store
    switch (shipping.kind) {
        case 'free_over': {
            return fill(
                subtotal >= shipping.threshold ? ordersCopy.freeOverMet : ordersCopy.freeOver,
                shipping.threshold
            )
        }
        case 'flat': {
            return fill(ordersCopy.flat, shipping.amount)
        }
        case 'from': {
            return fill(ordersCopy.from, shipping.amount)
        }
        case 'checkout': {
            return ordersCopy.checkout
        }
        case 'none': {
            return ordersCopy.none
        }
    }
}

type BomRow = {
    line: BomLine
    item: CatalogPart
    running: number
    index: number
}

const withRunningTotals = (parts: readonly BomLine[]): readonly BomRow[] => {
    const rows: BomRow[] = []
    let running = 0
    for (const [index, line] of parts.entries()) {
        running += lineCost(line)
        rows.push({ line, item: PARTS[line.part], running, index })
    }
    return rows
}

export function BomTable() {
    const [type, setType] = useState<NodeType>('base')
    const bom = bomFor(type)
    const total = bomTotal(bom)
    const rows = withRunningTotals(bom.parts)

    const columns: readonly Column<BomRow>[] = [
        {
            key: 'part',
            header: 'Part',
            render: ({ line, item }) => {
                const primary = primaryVendor(item)
                return (
                    <Stack gap={1} align='start'>
                        <Row gap={2}>
                            <TextLink to={primary.url} tone='quiet' size='sm'>
                                {item.component}
                            </TextLink>
                            {line.inheritedFromBase ? <Badge size='xs'>base</Badge> : null}
                        </Row>
                        <Text size='xs' tone='muted' measure={66}>
                            {primary.product}
                        </Text>
                        <Text size='xs' tone='faint' measure={66}>
                            {item.detail}
                        </Text>
                    </Stack>
                )
            },
        },
        {
            key: 'stores',
            header: 'Stores',
            render: ({ item }) => (
                <Stack gap={2} align='start'>
                    {item.vendors.map((vendor) => (
                        <Stack key={vendor.url} gap={0} align='start'>
                            <TextLink to={vendor.url} tone='quiet' size='xs'>
                                {storeFor(vendor.store).name}
                            </TextLink>
                            <Text size='xs' tone='faint'>
                                {money(vendor.unitPrice)}
                            </Text>
                        </Stack>
                    ))}
                </Stack>
            ),
        },
        {
            key: 'qty',
            header: 'Qty',
            align: 'end',
            render: ({ line }) => <Value tone='faint'>{line.quantity}</Value>,
        },
        {
            key: 'price',
            header: 'Price',
            align: 'end',
            render: ({ line }) => <Value>{money(lineCost(line))}</Value>,
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
                    <Metric label={ordersCopy.label} value={orderCount(bom)} size='sm' />
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

            <Box tone='surface' padding={0} radius='md' className='clip'>
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
                        getRowKey={({ line, index }) => `${line.part}-${String(index)}`}
                        footer={
                            <Row justify='between' gap={3}>
                                <Text size='xs' tone='faint'>
                                    {bom.parts.length} {plural(bom.parts.length, 'line')} · prices
                                    checked {buildContent.bom.pricesCheckedOn} · excludes shipping
                                    and sales tax
                                </Text>
                                <Value tone='fire' size='md' weight={700}>
                                    {money(total)}
                                </Value>
                            </Row>
                        }
                    />
                </Stack>
            </Box>

            <OrderPlan baskets={supplierBaskets(bom)} />
        </Stack>
    )
}

/** The bill of materials regrouped the way it is actually paid for. */
function OrderPlan({ baskets }: { baskets: readonly Basket[] }) {
    return (
        <Box tone='surface' padding={5} radius='md'>
            <Stack gap={4}>
                <Stack gap={2}>
                    <Heading level={3} size='sm'>
                        {ordersCopy.title}
                    </Heading>
                    <Text size='sm' tone='muted' measure={84}>
                        {ordersCopy.lede}
                    </Text>
                </Stack>

                <Stack gap={3}>
                    {baskets.map((basket) => {
                        const store = storeFor(basket.store)
                        return (
                            <Stack key={basket.store} gap={1}>
                                <Row gap={3} justify='between'>
                                    <TextLink
                                        to={store.policyUrl ?? store.url}
                                        tone='quiet'
                                        size='sm'
                                    >
                                        {store.name}
                                    </TextLink>
                                    <Value>{price(basket.subtotal)}</Value>
                                </Row>
                                <Text size='xs' tone='faint' measure={84}>
                                    {basket.lines.length} {plural(basket.lines.length, 'part')} ·{' '}
                                    {shippingCaption(store, basket.subtotal)}
                                    {store.note ? ` · ${store.note}` : ''}
                                </Text>
                            </Stack>
                        )
                    })}
                </Stack>
            </Stack>
        </Box>
    )
}

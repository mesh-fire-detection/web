import { useState } from 'react'

import { useUnitSystem } from '@components/app/UnitsProvider'
import { SearchField } from '@components/shared/forms/Field'
import { Form, FormActions } from '@components/shared/forms/Form'
import { SelectField } from '@components/shared/forms/NumericFields'
import { CollectionToolbar } from '@components/shared/page/CollectionToolbar'
import type { Column } from '@components/shared/page/DataTable'
import { DataTable } from '@components/shared/page/DataTable'
import { Row, Stack } from '@components/shared/primitives/Layout'
import { Text, Value } from '@components/shared/typography/Text'
import { BareButton, Button } from '@components/shared/widgets/Action'
import { Badge, StatusDot } from '@components/shared/widgets/Badge'
import { EmptyState } from '@components/shared/widgets/Callout'
import { NODES, type MeshNode } from '@core/content/network/network'
import { coordinate, sinceMinutes } from '@core/format/format'
import { formatLength } from '@core/format/units'

const STATUS_KIND = { online: 'live', degraded: 'warn', offline: 'dead' } as const
const STATUS_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'online', label: 'Online' },
    { value: 'degraded', label: 'Degraded' },
    { value: 'offline', label: 'Offline' },
] as const
type NodeSortKey = 'name' | 'type' | 'battery' | 'heard' | 'antenna' | 'deployed'
type NodeStatusFilter = (typeof STATUS_OPTIONS)[number]['value']

export function NodeTable({
    selectedId,
    onSelect,
}: {
    selectedId: string | null
    onSelect: (node: MeshNode) => void
}) {
    const { system } = useUnitSystem()
    const [queryDraft, setQueryDraft] = useState('')
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<NodeStatusFilter>('all')
    const [sort, setSort] = useState<{
        key: NodeSortKey
        direction: 'ascending' | 'descending'
    } | null>(null)
    const columns: readonly Column<MeshNode>[] = [
        {
            key: 'name',
            header: 'Node',
            sortValue: (node) => node.name,
            render: (node) => (
                <BareButton
                    className='node_row'
                    onClick={() => {
                        onSelect(node)
                    }}
                >
                    <Row gap={3} wrap={false}>
                        <StatusDot
                            kind={STATUS_KIND[node.status]}
                            pulse={node.status === 'online'}
                        />
                        <Stack gap={0} minWidth0 align='start'>
                            <Text
                                as='span'
                                size='sm'
                                weight={600}
                                tone={selectedId === node.id ? 'fire' : 'default'}
                            >
                                {node.name}
                            </Text>
                            <Text as='span' size='2xs' mono tone='faint'>
                                {coordinate(node.position)}
                            </Text>
                        </Stack>
                    </Row>
                </BareButton>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            sortValue: (node) => node.type,
            render: (node) => <Badge>{node.type}</Badge>,
        },
        {
            key: 'battery',
            header: 'Battery',
            sortValue: (node) => node.batteryPct,
            align: 'end',
            render: (node) =>
                node.batteryPct === null ? (
                    <Value tone='faint'>—</Value>
                ) : (
                    <Value
                        tone={
                            node.batteryPct < 25
                                ? 'dead'
                                : node.batteryPct < 50
                                  ? 'warn'
                                  : 'default'
                        }
                    >
                        {node.batteryPct}%
                    </Value>
                ),
        },
        {
            key: 'heard',
            header: 'Last heard',
            sortValue: (node) => node.lastHeartbeatMin,
            align: 'end',
            render: (node) => (
                <Value
                    tone={
                        node.lastHeartbeatMin === null || node.lastHeartbeatMin > 60
                            ? 'dead'
                            : 'muted'
                    }
                >
                    {sinceMinutes(node.lastHeartbeatMin)}
                </Value>
            ),
        },
        {
            key: 'antenna',
            header: 'Ant. AGL',
            sortValue: (node) => node.antennaHeightM,
            align: 'end',
            render: (node) => (
                <Value tone='muted'>{formatLength(node.antennaHeightM, system)}</Value>
            ),
        },
        {
            key: 'deployed',
            header: 'Deployed',
            sortValue: (node) => node.deployedOn,
            align: 'end',
            render: (node) => <Value tone='faint'>{node.deployedOn}</Value>,
        },
    ]

    const normalizedQuery = query.trim().toLocaleLowerCase()
    const filteredNodes = NODES.filter((node) => {
        const matchesStatus = status === 'all' || node.status === status
        const matchesQuery =
            normalizedQuery.length === 0 ||
            `${node.name} ${node.id} ${node.type}`.toLocaleLowerCase().includes(normalizedQuery)
        return matchesStatus && matchesQuery
    })
    const selectedColumn = sort ? columns.find((column) => column.key === sort.key) : undefined
    const getSortValue = selectedColumn?.sortValue
    const rows = getSortValue
        ? filteredNodes.toSorted((left, right) => {
              const leftValue = getSortValue(left)
              const rightValue = getSortValue(right)
              if (leftValue === null) return rightValue === null ? 0 : 1
              if (rightValue === null) return -1
              const compared =
                  typeof leftValue === 'string' && typeof rightValue === 'string'
                      ? leftValue.localeCompare(rightValue)
                      : Number(leftValue) - Number(rightValue)
              return sort?.direction === 'descending' ? -compared : compared
          })
        : filteredNodes

    return (
        <Stack gap={3}>
            <Form
                ariaLabel='Search and filter nodes'
                className='collection_form'
                onSubmit={(event) => {
                    event.preventDefault()
                    setQuery(queryDraft.trim())
                }}
            >
                <CollectionToolbar itemLabel='node' resultCount={filteredNodes.length}>
                    <SearchField
                        description='Search by node name, ID, or type.'
                        label='Search nodes'
                        onChange={(next) => {
                            setQueryDraft(next)
                            if (next.length === 0) setQuery('')
                        }}
                        placeholder='Name, ID, or type'
                        value={queryDraft}
                    />
                    <SelectField
                        label='Status'
                        onChange={setStatus}
                        options={STATUS_OPTIONS}
                        value={status}
                    />
                    <FormActions>
                        <Button type='submit'>Search</Button>
                    </FormActions>
                </CollectionToolbar>
            </Form>
            <DataTable
                caption='Nodes ordered from the branch head outward. Select a column heading to sort.'
                columns={columns}
                emptyContent={
                    <EmptyState title='No nodes match these filters'>
                        Change the search or status filter to see more nodes.
                    </EmptyState>
                }
                getRowKey={(node) => node.id}
                rows={rows}
                sort={{
                    key: sort?.key ?? null,
                    direction: sort?.direction ?? 'ascending',
                    onChange: (key) => {
                        if (columns.every((column) => column.key !== key || !column.sortValue))
                            return
                        setSort((current) => ({
                            key: key as NodeSortKey,
                            direction:
                                current?.key === key && current.direction === 'ascending'
                                    ? 'descending'
                                    : 'ascending',
                        }))
                    },
                }}
            />
        </Stack>
    )
}

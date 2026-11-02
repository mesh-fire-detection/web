import { useEffect, useState } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'

import { signInToSee } from '@components/account/flow'
import { useSession } from '@components/app/SessionProvider'
import { Page } from '@components/layout/Page'
import {
    isFiltered,
    isSortKey,
    listNodes,
    mapLink,
    minutesSince,
    NODE_STATUSES,
    NODE_TYPES,
    readFilters,
    sortValue,
    STATUS_KIND,
    toggleSort,
    type Filters,
    writeFilters,
} from '@components/pages/nodes/listing'
import { SegmentedField } from '@components/shared/forms/ChoiceFields'
import { SearchField } from '@components/shared/forms/Field'
import { Form, FormActions } from '@components/shared/forms/Form'
import { SelectField } from '@components/shared/forms/NumericFields'
import { CollectionToolbar } from '@components/shared/page/CollectionToolbar'
import { DataTable, type Column } from '@components/shared/page/DataTable'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Text, Value } from '@components/shared/typography/Text'
import { Button, ButtonLink, TextLink } from '@components/shared/widgets/Action'
import { Badge, StatusLabel } from '@components/shared/widgets/Badge'
import { EmptyState, ErrorState } from '@components/shared/widgets/Callout'
import { fetchNodes, type Node } from '@core/api/nodes'
import { nodesContent } from '@core/content/nodes/nodes'
import { coordinate, sinceMinutes } from '@core/format/format'

const copy = nodesContent

const SHOW_OPTIONS = [
    { value: 'all', label: copy.filters.all },
    { value: 'mine', label: copy.filters.mine },
] as const
const TYPE_OPTIONS = [
    { value: 'all', label: copy.filters.anyType },
    ...NODE_TYPES.map((type) => ({ value: type, label: copy.types[type] })),
] as const
const STATUS_OPTIONS = [
    { value: 'all', label: copy.filters.anyStatus },
    ...NODE_STATUSES.map((status) => ({ value: status, label: copy.statuses[status] })),
] as const

const UNFILTERED = { mine: false, type: null, status: null, query: '' } as const

/** Where it is, as precisely as the API says: approximate unless it is yours or chosen exact. */
function place(node: Node): string {
    if (node.position === null) return copy.noPosition
    const shown = coordinate([node.position[0], node.position[1]])
    return node.approximate ? `${copy.approximately} ${shown}` : shown
}

function columnsFor(now: number): readonly Column<Node>[] {
    return [
        {
            key: 'name',
            header: copy.table.node,
            sortValue: (node) => sortValue(node, 'name', now),
            render: (node) => (
                <Stack gap={1} minWidth0 align='start'>
                    <Row gap={2}>
                        <TextLink to={`/nodes/${encodeURIComponent(node.id)}`}>
                            {node.name}
                        </TextLink>
                        {node.mine ? (
                            <Badge kind='fire' size='xs'>
                                {copy.yours}
                            </Badge>
                        ) : null}
                        {node.enabled ? null : <Badge size='xs'>{copy.disabled}</Badge>}
                    </Row>
                    <Text as='span' size='2xs' mono tone='faint'>
                        {node.id} · {place(node)}
                    </Text>
                </Stack>
            ),
        },
        {
            key: 'type',
            header: copy.table.type,
            sortValue: (node) => sortValue(node, 'type', now),
            render: (node) =>
                node.type === null ? (
                    <Value tone='faint'>—</Value>
                ) : (
                    <Badge>{copy.types[node.type]}</Badge>
                ),
        },
        {
            key: 'status',
            header: copy.table.status,
            sortValue: (node) => sortValue(node, 'status', now),
            render: (node) => (
                <StatusLabel kind={STATUS_KIND[node.status]} pulse={node.status === 'online'}>
                    {copy.statuses[node.status]}
                </StatusLabel>
            ),
        },
        {
            key: 'battery',
            header: copy.table.battery,
            sortValue: (node) => sortValue(node, 'battery', now),
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
            header: copy.table.heard,
            sortValue: (node) => sortValue(node, 'heard', now),
            align: 'end',
            render: (node) => {
                const minutes = minutesSince(node.lastHeardAt, now)
                return (
                    <Value tone={minutes === null || minutes > 60 ? 'dead' : 'muted'}>
                        {sinceMinutes(minutes)}
                    </Value>
                )
            },
        },
    ]
}

function NodeFilters({
    filters,
    count,
    apply,
    draft,
    setDraft,
}: {
    readonly filters: Filters
    readonly count: number
    readonly apply: (next: Filters) => void
    /** The search as typed, applied on submit. */
    readonly draft: string
    readonly setDraft: (next: string) => void
}) {
    return (
        <Form
            ariaLabel={copy.filters.label}
            className='collection_form'
            onSubmit={(event) => {
                event.preventDefault()
                apply({ ...filters, query: draft.trim() })
            }}
        >
            <CollectionToolbar itemLabel='node' resultCount={count}>
                <SegmentedField
                    label={copy.filters.show}
                    onChange={(show) => {
                        apply({ ...filters, mine: show === 'mine' })
                    }}
                    options={SHOW_OPTIONS}
                    value={filters.mine ? 'mine' : 'all'}
                />
                <SelectField
                    label={copy.filters.type}
                    onChange={(type) => {
                        apply({ ...filters, type: type === 'all' ? null : type })
                    }}
                    options={TYPE_OPTIONS}
                    value={filters.type ?? 'all'}
                />
                <SelectField
                    label={copy.filters.status}
                    onChange={(status) => {
                        apply({
                            ...filters,
                            status: status === 'all' ? null : status,
                        })
                    }}
                    options={STATUS_OPTIONS}
                    value={filters.status ?? 'all'}
                />
                <SearchField
                    description={copy.filters.searchDescription}
                    label={copy.filters.search}
                    onChange={(next) => {
                        setDraft(next)
                        if (next.length === 0) apply({ ...filters, query: '' })
                    }}
                    placeholder={copy.filters.searchPlaceholder}
                    value={draft}
                />
                <FormActions>
                    <Button type='submit'>{copy.filters.submit}</Button>
                </FormActions>
            </CollectionToolbar>
        </Form>
    )
}

function ConnectLink() {
    return (
        <ButtonLink to='/connect' variant='secondary'>
            {copy.empty.connect}
        </ButtonLink>
    )
}

function NodeDirectory() {
    const [params, setParams] = useSearchParams()
    const filters = readFilters(params)
    const [loaded, setLoaded] = useState<
        'failed' | { readonly nodes: readonly Node[]; readonly at: number } | null
    >(null)
    const [attempt, setAttempt] = useState(0)
    const [draft, setDraft] = useState(filters.query)

    useEffect(() => {
        let current = true
        void fetchNodes().then((result) => {
            if (current) setLoaded(result.ok ? { nodes: result.data, at: Date.now() } : 'failed')
        })
        return () => {
            current = false
        }
    }, [attempt])

    if (loaded === null) {
        return (
            <Text role='status' tone='muted'>
                {copy.loading}
            </Text>
        )
    }
    if (loaded === 'failed') {
        return (
            <ErrorState
                onRetry={() => {
                    setLoaded(null)
                    setAttempt((count) => count + 1)
                }}
                title={copy.failed.title}
            >
                {copy.failed.body}
            </ErrorState>
        )
    }
    if (loaded.nodes.length === 0) {
        return (
            <EmptyState action={<ConnectLink />} title={copy.empty.none.title}>
                {copy.empty.none.body}
            </EmptyState>
        )
    }

    // Replace rather than push: each filter change is not a step to go back through.
    const apply = (next: Filters) => {
        setParams(writeFilters(next), { replace: true })
    }

    const rows = listNodes(loaded.nodes, filters, loaded.at)
    const columns = columnsFor(loaded.at)
    const noneMine = filters.mine && loaded.nodes.every((node) => !node.mine)
    const onMap = mapLink(rows)

    return (
        <Stack gap={3}>
            <NodeFilters
                apply={apply}
                count={rows.length}
                draft={draft}
                filters={filters}
                setDraft={setDraft}
            />
            {onMap === null ? null : (
                <Row justify='end'>
                    <TextLink size='sm' to={onMap}>
                        {copy.viewOnMap}
                    </TextLink>
                </Row>
            )}
            <DataTable
                caption={copy.table.caption}
                columns={columns}
                emptyContent={
                    noneMine ? (
                        <EmptyState action={<ConnectLink />} title={copy.empty.noneMine.title}>
                            {copy.empty.noneMine.body}
                        </EmptyState>
                    ) : (
                        <EmptyState
                            action={
                                isFiltered(filters) ? (
                                    <Button
                                        onClick={() => {
                                            setDraft('')
                                            apply({ ...filters, ...UNFILTERED })
                                        }}
                                        variant='secondary'
                                    >
                                        {copy.empty.clear}
                                    </Button>
                                ) : undefined
                            }
                            title={copy.empty.noResults.title}
                        >
                            {copy.empty.noResults.body}
                        </EmptyState>
                    )
                }
                getRowKey={(node) => node.id}
                rows={rows}
                sort={{
                    key: filters.sort,
                    direction: filters.direction,
                    onChange: (key) => {
                        if (isSortKey(key)) apply(toggleSort(filters, key))
                    },
                }}
            />
        </Stack>
    )
}

/** Every registered node, for signed-in people only; the anonymous view is the map. */
export function NodesPage() {
    const { session } = useSession()
    const { pathname, search } = useLocation()

    if (session.status === 'signed_out') {
        return <Navigate replace to={signInToSee(`${pathname}${search}`)} />
    }
    return session.status === 'loading' ? (
        <Page title={copy.title}>{null}</Page>
    ) : (
        <Page lede={copy.lede} title={copy.title}>
            <Section width='wide'>
                <NodeDirectory />
            </Section>
        </Page>
    )
}

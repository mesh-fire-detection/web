import { useEffect, useState } from 'react'

import { useSession } from '@components/app/SessionProvider'
import { Page } from '@components/layout/Page'
import { minutesSince } from '@components/pages/nodes/listing'
import { DataTable, type Column } from '@components/shared/page/DataTable'
import { List, ListItem } from '@components/shared/page/List'
import { Box, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text, Value } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import { Badge, StatusLabel } from '@components/shared/widgets/Badge'
import { EmptyState, ErrorState } from '@components/shared/widgets/Callout'
import { fetchGatewaysStatus, type GatewayStatus, type GatewaysStatus } from '@core/api/gateways'
import { gatewaysContent } from '@core/content/nodes/gateways'
import { nodesContent } from '@core/content/nodes/nodes'
import { sinceMinutes } from '@core/format/format'

const copy = gatewaysContent
const words = copy.live

/** Delivering within half an hour, quiet until two, then silent: the same as a node going offline. */
const QUIET_MIN = 30
const SILENT_MIN = 120

type DeliveryState = 'live' | 'warn' | 'dead' | 'neutral'

function deliveryState(minutes: number | null): DeliveryState {
    if (minutes === null) return 'neutral'
    if (minutes < QUIET_MIN) return 'live'
    return minutes < SILENT_MIN ? 'warn' : 'dead'
}

/** The three ways in, each as a route and what it takes to keep it working. */
function Paths() {
    return (
        <Grid gap={4} minColumnWidth={280}>
            {copy.paths.map((path) => (
                <Box key={path.id} padding={5}>
                    <Stack gap={3}>
                        <Stack gap={1}>
                            <Heading level={2} size='md'>
                                {path.title}
                            </Heading>
                            <Text size='xs' tone='faint' mono uppercase>
                                {path.via}
                            </Text>
                        </Stack>
                        <Text size='sm' tone='muted'>
                            {path.when}
                        </Text>
                        <Stack gap={1}>
                            <Text size='xs' tone='faint' weight={600}>
                                {copy.routeLabel}
                            </Text>
                            <Text size='sm' mono>
                                {path.route.join(' → ')}
                            </Text>
                        </Stack>
                        <Stack gap={1}>
                            <Text size='xs' tone='faint' weight={600}>
                                {copy.needsLabel}
                            </Text>
                            <List gap={1}>
                                {path.needs.map((need) => (
                                    <ListItem key={need} size='sm'>
                                        {need}
                                    </ListItem>
                                ))}
                            </List>
                        </Stack>
                    </Stack>
                </Box>
            ))}
        </Grid>
    )
}

function columnsFor(now: number): readonly Column<GatewayStatus>[] {
    return [
        {
            key: 'gateway',
            header: words.columns.gateway,
            render: (gateway) => (
                <Row gap={2}>
                    <TextLink to={`/nodes/${encodeURIComponent(gateway.nodeId)}`}>
                        {gateway.name}
                    </TextLink>
                    {gateway.enabled ? null : <Badge size='xs'>{words.disabled}</Badge>}
                </Row>
            ),
        },
        {
            key: 'paths',
            header: words.columns.paths,
            render: (gateway) => (
                <Stack gap={1} align='start'>
                    {gateway.connections.map((connection) => (
                        <Text key={connection.via} as='span' size='sm'>
                            {nodesContent.connections.via[connection.via]}:{' '}
                            {connection.lastDeliveryAt === null
                                ? words.never
                                : sinceMinutes(minutesSince(connection.lastDeliveryAt, now))}
                        </Text>
                    ))}
                </Stack>
            ),
        },
        {
            key: 'last',
            header: words.columns.last,
            render: (gateway) => {
                const state = deliveryState(minutesSince(gateway.lastDeliveryAt, now))
                return (
                    <StatusLabel kind={state} pulse={state === 'live'}>
                        {words.states[state]}
                    </StatusLabel>
                )
            },
        },
        {
            key: 'refused',
            header: words.columns.refused,
            align: 'end',
            render: (gateway) => (
                <Value tone={gateway.rejectedLast24h > 0 ? 'warn' : 'muted'}>
                    {gateway.rejectedLast24h}
                </Value>
            ),
        },
    ]
}

const BROKER_KIND = { connected: 'live', disconnected: 'dead', disabled: 'neutral' } as const

/** Live state for each gateway, from backend#37; members only. */
function LiveGateways() {
    const [loaded, setLoaded] = useState<
        'failed' | { readonly status: GatewaysStatus; readonly at: number } | null
    >(null)
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let current = true
        void fetchGatewaysStatus().then((result) => {
            if (current) setLoaded(result.ok ? { status: result.data, at: Date.now() } : 'failed')
        })
        return () => {
            current = false
        }
    }, [attempt])

    if (loaded === null) {
        return (
            <Text role='status' tone='muted'>
                {words.loading}
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
                title={words.failed.title}
            >
                {words.failed.body}
            </ErrorState>
        )
    }
    const { status, at } = loaded
    return (
        <Stack gap={3}>
            <Row gap={2}>
                <Text size='sm' tone='muted'>
                    {words.broker}
                </Text>
                <StatusLabel kind={BROKER_KIND[status.broker]}>
                    {words.brokerStates[status.broker]}
                </StatusLabel>
            </Row>
            <DataTable
                caption={words.caption}
                columns={columnsFor(at)}
                emptyContent={<EmptyState title={words.none.title}>{words.none.body}</EmptyState>}
                getRowKey={(gateway) => gateway.nodeId}
                rows={status.gateways}
            />
        </Stack>
    )
}

/** Every path into the server, with live gateway state for signed-in people (web#14). */
export function GatewaysPage() {
    const { session } = useSession()

    return (
        <Page lede={copy.lede} title={copy.title}>
            <Section width='wide'>
                <Paths />
            </Section>
            <Section width='wide'>
                <Stack gap={3}>
                    <Stack gap={1}>
                        <Heading level={2} size='lg'>
                            {words.title}
                        </Heading>
                        <Text size='sm' tone='muted'>
                            {words.lede}
                        </Text>
                    </Stack>
                    {session.status === 'signed_in' ? (
                        <LiveGateways />
                    ) : session.status === 'signed_out' ? (
                        <TextLink to='/sign-in?next=%2Fgateways'>{words.signIn}</TextLink>
                    ) : null}
                </Stack>
            </Section>
        </Page>
    )
}

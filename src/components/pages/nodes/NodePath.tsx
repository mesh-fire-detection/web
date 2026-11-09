import { Fragment, useEffect, useState } from 'react'

import { minutesSince } from '@components/pages/nodes/listing'
import { DataTable, type Column } from '@components/shared/page/DataTable'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text, Value } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import { fetchNodePath, type Node, type NodeConnection, type NodePath } from '@core/api/nodes'
import { nodeContent } from '@core/content/nodes/node'
import { nodesContent } from '@core/content/nodes/nodes'
import { sinceMinutes } from '@core/format/format'

const words = nodeContent.path
const connectionWords = nodesContent.connections

type Stop = { readonly label: string; readonly to?: string }
type Link = { readonly label: string; readonly at: string | null }
/** One route drawn left to right: a stop, then a link and a stop, and so on. */
type Route = {
    readonly key: string
    readonly start: Stop
    readonly legs: readonly (readonly [Link, Stop])[]
}

const ago = (at: string | null, now: number): string =>
    at === null ? connectionWords.never : sinceMinutes(minutesSince(at, now))

function hopsLabel(hops: number | null): string {
    if (hops === null) return words.unknownHops
    if (hops === 0) return words.direct
    return hops === 1 ? words.oneHop : `${String(hops)} ${words.hops}`
}

/** The gateway's leg to the server: through the broker or Notehub. */
function serverLegs(connection: NodeConnection): readonly (readonly [Link, Stop])[] {
    const network =
        connection.network === null ? '' : ` · ${connectionWords.network[connection.network]}`
    const link = {
        label: `${connectionWords.via[connection.via]}${network}`,
        at: connection.lastUsedAt,
    }
    const relay = connection.via === 'notecard' ? words.notehub : words.broker
    return [
        [link, { label: relay }],
        [{ label: 'HTTPS', at: null }, { label: words.server }],
    ]
}

function routesFor(node: Node, path: NodePath): Route[] {
    const routes = path.deliveries.flatMap((delivery) => {
        const self = delivery.gateway.id === node.id
        const gateway: Stop = self
            ? { label: words.self }
            : {
                  label: delivery.gateway.name,
                  to: `/nodes/${encodeURIComponent(delivery.gateway.id)}`,
              }
        const signal = delivery.signal === null ? '' : ` · SNR ${String(delivery.signal.snr)} dB`
        const mesh: readonly (readonly [Link, Stop])[] = self
            ? []
            : [
                  [
                      {
                          label: `${words.lora} · ${hopsLabel(delivery.hops)}${signal}`,
                          at: delivery.lastAt,
                      },
                      gateway,
                  ],
              ]
        return delivery.connections.map((connection) => ({
            key: `${delivery.gateway.id}-${connection.via}`,
            start: { label: self ? words.self : node.name },
            legs: [...mesh, ...serverLegs(connection)],
        }))
    })
    const browser = node.connections.find((connection) => connection.via === 'browser')
    return browser === undefined
        ? routes
        : [
              ...routes,
              {
                  key: 'browser',
                  start: { label: node.name },
                  legs: [
                      [
                          { label: connectionWords.via.browser, at: browser.lastUsedAt },
                          { label: words.connect },
                      ],
                      [{ label: 'HTTPS', at: null }, { label: words.server }],
                  ],
              },
          ]
}

function StopChip({ stop }: { readonly stop: Stop }) {
    return (
        <Box padding={2} radius='sm' tone='surface-2'>
            {stop.to === undefined ? (
                <Text as='span' size='sm' weight={600}>
                    {stop.label}
                </Text>
            ) : (
                <TextLink size='sm' to={stop.to}>
                    {stop.label}
                </TextLink>
            )}
        </Box>
    )
}

function LinkArrow({ link, now }: { readonly link: Link; readonly now: number }) {
    return (
        <Stack gap={0} align='center'>
            <Text as='span' size='2xs' tone='muted'>
                {link.label}
            </Text>
            <Text as='span' size='sm' tone='faint' mono>
                ──→
            </Text>
            {link.at === null ? null : (
                <Text as='span' size='2xs' tone='faint'>
                    {ago(link.at, now)}
                </Text>
            )}
        </Stack>
    )
}

/** Each way this node's data has reached the server, drawn stop by stop. */
function Diagram({ routes, now }: { readonly routes: readonly Route[]; readonly now: number }) {
    return routes.length === 0 ? (
        <Text size='sm' tone='muted'>
            {words.none}
        </Text>
    ) : (
        <Stack gap={4}>
            {routes.map((route) => (
                <Row
                    key={route.key}
                    gap={2}
                    align='center'
                    role='group'
                    ariaLabel={describe(route)}
                >
                    <StopChip stop={route.start} />
                    {route.legs.map(([link, stop], index) => (
                        <Fragment key={`${route.key}-${String(index)}`}>
                            <LinkArrow link={link} now={now} />
                            <StopChip stop={stop} />
                        </Fragment>
                    ))}
                </Row>
            ))}
        </Stack>
    )
}

/** The route as one sentence, for screen readers. */
const describe = (route: Route): string =>
    [route.start.label, ...route.legs.map(([link, stop]) => `${link.label} to ${stop.label}`)].join(
        ', '
    )

type Nearby = NodePath['nearby'][number]

const snr = (signal: Nearby['hears']) =>
    signal === null ? <Value tone='faint'>—</Value> : <Value>{signal.snr} dB</Value>

const NEARBY_COLUMNS: readonly Column<Nearby>[] = [
    {
        key: 'node',
        header: words.nearby.node,
        render: (row) => (
            <TextLink to={`/nodes/${encodeURIComponent(row.node.id)}`}>{row.node.name}</TextLink>
        ),
    },
    { key: 'hears', header: words.nearby.hears, align: 'end', render: (row) => snr(row.hears) },
    {
        key: 'heardBy',
        header: words.nearby.heardBy,
        align: 'end',
        render: (row) => snr(row.heardBy),
    },
]

/** Path to the server and the nodes around it, from backend `/v1/nodes/:id/path`. */
export function NodePathView({ node }: { readonly node: Node }) {
    const [loaded, setLoaded] = useState<
        'failed' | { readonly path: NodePath; readonly at: number } | null
    >(null)

    useEffect(() => {
        let current = true
        void fetchNodePath(node.id).then((result) => {
            if (current) setLoaded(result.ok ? { path: result.data, at: Date.now() } : 'failed')
        })
        return () => {
            current = false
        }
    }, [node.id])

    return (
        <Stack gap={7}>
            <Stack gap={3}>
                <Stack gap={1}>
                    <Heading level={2} size='md'>
                        {words.title}
                    </Heading>
                    <Text size='sm' tone='muted'>
                        {words.lede}
                    </Text>
                </Stack>
                {loaded === null ? (
                    <Text role='status' size='sm' tone='muted'>
                        {words.loading}
                    </Text>
                ) : loaded === 'failed' ? (
                    <Text size='sm' tone='muted'>
                        {words.failed}
                    </Text>
                ) : (
                    <Diagram now={loaded.at} routes={routesFor(node, loaded.path)} />
                )}
            </Stack>
            {loaded === null || loaded === 'failed' ? null : (
                <Stack gap={3}>
                    <Stack gap={1}>
                        <Heading level={2} size='md'>
                            {words.nearby.title}
                        </Heading>
                        <Text size='sm' tone='muted'>
                            {words.nearby.lede}
                        </Text>
                    </Stack>
                    <DataTable
                        caption={words.nearby.caption}
                        columns={NEARBY_COLUMNS}
                        emptyContent={
                            <Text size='sm' tone='muted'>
                                {words.nearby.none}
                            </Text>
                        }
                        getRowKey={(row) => row.node.id}
                        rows={loaded.path.nearby}
                    />
                </Stack>
            )}
        </Stack>
    )
}

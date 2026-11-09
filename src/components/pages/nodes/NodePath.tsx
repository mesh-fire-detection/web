import { Fragment, useEffect, useState } from 'react'

import { Age, NodeTag } from '@components/pages/build/nearby/Indicators'
import { minutesSince } from '@components/pages/nodes/listing'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button, TextLink } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { Icon } from '@components/shared/widgets/Icon'
import { fetchNodePath, type Node, type NodeConnection, type NodePath } from '@core/api/nodes'
import { nearbyDetailsContent as peerWords } from '@core/content/build/nearby/nodeDetails'
import { nodeContent } from '@core/content/nodes/node'
import { nodesContent } from '@core/content/nodes/nodes'
import { sinceMinutes } from '@core/format/format'
import { isMfdNode } from '@core/nearby/firmware'
import { formatNumber, metricLabel, SIGNAL_TONE, signalQuality } from '@core/nearby/metrics'

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
    return hops === 1 ? words.oneHop : `${words.relayedBy} ${String(hops)} ${words.hops}`
}

/** "Cellular (Notecard)", or "Wi-Fi" for the gateway's own internet. */
function linkLabel(connection: NodeConnection): string {
    if (connection.via !== 'notecard') return connectionWords.network.wifi
    return connection.network === null
        ? words.notecard
        : `${connectionWords.network[connection.network]} (${words.notecard})`
}

/** The gateway's leg to Mesh Fire Detection: through the message relay or Notehub. */
function serverLegs(connection: NodeConnection): readonly (readonly [Link, Stop])[] {
    const relay = connection.via === 'notecard' ? words.notehub : words.broker
    return [
        [{ label: linkLabel(connection), at: connection.lastUsedAt }, { label: relay }],
        [{ label: words.internet, at: null }, { label: words.server }],
    ]
}

/** When a route was last used: its first link, the one this node's data took. */
const usedAt = (route: Route): string => route.legs[0]?.[0].at ?? ''

/** Newest first, so the routes in use now come before the ones a node used to take. */
function routesFor(node: Node, path: NodePath): Route[] {
    return allRoutes(node, path).toSorted((a, b) => usedAt(b).localeCompare(usedAt(a)))
}

function allRoutes(node: Node, path: NodePath): Route[] {
    const routes = path.deliveries.flatMap((delivery) => {
        const self = delivery.gateway.id === node.id
        const gateway: Stop = self
            ? { label: words.self }
            : {
                  label: delivery.gateway.name,
                  to: `/nodes/${encodeURIComponent(delivery.gateway.id)}`,
              }
        const signal =
            delivery.signal === null
                ? ''
                : ` · ${peerWords.quality[signalQuality(delivery.signal.snr)]} ${words.signal}`
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
                      [{ label: words.internet, at: null }, { label: words.server }],
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
const VISIBLE_ROUTES = 3

function Diagram({ routes, now }: { readonly routes: readonly Route[]; readonly now: number }) {
    const [expanded, setExpanded] = useState(false)
    if (routes.length === 0) {
        return (
            <Text size='sm' tone='muted'>
                {words.none}
            </Text>
        )
    }
    const shown = expanded ? routes : routes.slice(0, VISIBLE_ROUTES)
    return (
        <Stack gap={4}>
            {shown.map((route) => (
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
            {routes.length > VISIBLE_ROUTES ? (
                <Button
                    size='sm'
                    variant='ghost'
                    ariaExpanded={expanded}
                    onClick={() => {
                        setExpanded(!expanded)
                    }}
                >
                    {expanded ? words.fewerRoutes : `${words.allRoutes} (${String(routes.length)})`}
                </Button>
            ) : null}
        </Stack>
    )
}

/** The route as one sentence, for screen readers. */
const describe = (route: Route): string =>
    [route.start.label, ...route.legs.map(([link, stop]) => `${link.label} to ${stop.label}`)].join(
        ', '
    )

type Nearby = NodePath['nearby'][number]

const VISIBLE = 5

/** The signal badge, as /connect shows it: how well this node hears the other one. */
function SignalBadge({ entry }: { readonly entry: Nearby }) {
    const signal = entry.hears ?? entry.heardBy
    if (signal === null) return null
    const quality = signalQuality(signal.snr)
    return (
        <Badge kind='neutral' size='xs' mono={false} uppercase={false}>
            <Icon name='radio' size={14} />
            <Text as='span' size='xs' tone={SIGNAL_TONE[quality]}>
                {peerWords.quality[quality]} · {formatNumber(signal.snr, 'dB')}
                {signal.rssi === null ? '' : ` · ${formatNumber(signal.rssi, 'dBm')}`}
                {entry.hears === null ? ` · ${words.nearby.theyHear}` : ''}
            </Text>
        </Badge>
    )
}

/** One neighbour laid out like a /connect peer, its name linking to its page. */
function NearbyRow({ entry }: { readonly entry: Nearby }) {
    const { node } = entry
    const times = [entry.hears?.at, entry.heardBy?.at]
        .filter((at) => at !== undefined)
        .map((at) => Date.parse(at))
    const heard = times.length === 0 ? undefined : Math.max(...times)
    return (
        <div className='nearby_peer'>
            <NodeTag
                num={Number.parseInt(node.meshId.slice(1), 16)}
                ours={isMfdNode({ name: node.name, shortName: '', firmware: node.firmware ?? '' })}
                size='sm'
            />
            <Text size='sm' weight={600} className='nearby_peer_name'>
                <TextLink to={`/nodes/${encodeURIComponent(node.id)}`}>{node.name}</TextLink>
            </Text>
            <Text size='2xs' tone='faint' className='nearby_peer_meta'>
                {node.hardware ?? ''}
                {heard !== undefined && node.hardware !== null ? ' · ' : null}
                {heard === undefined ? null : (
                    <span>
                        {peerWords.lastHeard} <Age time={heard} />
                    </span>
                )}
            </Text>
            <div className='nearby_peer_link'>
                <SignalBadge entry={entry} />
            </div>
            {node.batteryPct === null ? null : (
                <Text size='xs' tone='muted' className='nearby_peer_readings'>
                    {metricLabel('deviceMetrics.batteryLevel')} {node.batteryPct} %
                </Text>
            )}
        </div>
    )
}

/** Strongest first, five at a time, as /connect lists a node's peers. */
function NearbyList({ nearby }: { readonly nearby: readonly Nearby[] }) {
    const [expanded, setExpanded] = useState(false)
    return nearby.length === 0 ? (
        <Text size='sm' tone='faint'>
            {words.nearby.none}
        </Text>
    ) : (
        <Stack gap={3}>
            <div className='nearby_peers'>
                {(expanded ? nearby : nearby.slice(0, VISIBLE)).map((entry) => (
                    <NearbyRow key={entry.node.id} entry={entry} />
                ))}
            </div>
            {nearby.length > VISIBLE ? (
                <Button
                    size='sm'
                    variant='ghost'
                    ariaExpanded={expanded}
                    onClick={() => {
                        setExpanded(!expanded)
                    }}
                >
                    {expanded
                        ? peerWords.showFewer
                        : `${peerWords.showAll} (${String(nearby.length)})`}
                </Button>
            ) : null}
        </Stack>
    )
}

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
        <>
            <Box tone='surface' padding={5} radius='md'>
                <Stack gap={3}>
                    <Stack gap={1}>
                        <Heading level={2} size='sm'>
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
            </Box>
            {loaded === null || loaded === 'failed' ? null : (
                <Box tone='surface' padding={5} radius='md'>
                    <Stack gap={3}>
                        <Stack gap={1}>
                            <Heading level={2} size='sm'>
                                {words.nearby.title}
                            </Heading>
                            <Text size='sm' tone='muted'>
                                {words.nearby.lede}
                            </Text>
                        </Stack>
                        <NearbyList nearby={loaded.path.nearby} />
                    </Stack>
                </Box>
            )}
        </>
    )
}

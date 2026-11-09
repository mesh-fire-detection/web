import { Fragment, useEffect, useState } from 'react'

import { Age, NodeTag } from '@components/pages/build/nearby/Indicators'
import { minutesSince } from '@components/pages/nodes/listing'
import { RouteLeg, RouteStop, RouteTrail } from '@components/shared/page/Timeline'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button, TextLink } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { Icon, type IconName } from '@components/shared/widgets/Icon'
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
type Link = { readonly label: string; readonly at: string | null; readonly icon?: IconName }
/** One route, read top to bottom: a stop, then a link and a stop, and so on. */
type Route = {
    readonly key: string
    /** What sets this route apart: the gateway it went through, or the browser. */
    readonly title: string
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

const NETWORK_ICON = { wifi: 'wifi', cellular: 'cell', satellite: 'radio' } as const

/** "Cellular (Notecard)", or "Wi-Fi" for the gateway's own internet, with its icon. */
function gatewayLink(connection: NodeConnection): Link {
    if (connection.via !== 'notecard') {
        return { label: connectionWords.network.wifi, at: connection.lastUsedAt, icon: 'wifi' }
    }
    return connection.network === null
        ? { label: words.notecard, at: connection.lastUsedAt }
        : {
              label: `${connectionWords.network[connection.network]} (${words.notecard})`,
              at: connection.lastUsedAt,
              icon: NETWORK_ICON[connection.network],
          }
}

/** The gateway's legs to Mesh Fire Detection: through the message relay or Notehub. */
function serverLegs(connection: NodeConnection): readonly (readonly [Link, Stop])[] {
    const relay = connection.via === 'notecard' ? words.notehub : words.broker
    return [
        [gatewayLink(connection), { label: relay }],
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
                          icon: 'radio',
                      },
                      {
                          label: delivery.gateway.name,
                          to: `/nodes/${encodeURIComponent(delivery.gateway.id)}`,
                      },
                  ],
              ]
        return delivery.connections.map((connection) => ({
            key: `${delivery.gateway.id}-${connection.via}`,
            title: self
                ? `${words.fromGateway} · ${gatewayLink(connection).label}`
                : `${words.through} ${delivery.gateway.name} · ${gatewayLink(connection).label}`,
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
                  title: words.fromBrowser,
                  start: { label: node.name },
                  legs: [
                      [
                          {
                              label: connectionWords.via.browser,
                              at: browser.lastUsedAt,
                              icon: 'usb',
                          },
                          { label: words.connect },
                      ],
                      [{ label: words.internet, at: null }, { label: words.server }],
                  ],
              },
          ]
}

function StopLabel({ stop }: { readonly stop: Stop }) {
    return stop.to === undefined ? (
        <Text as='span' size='sm' weight={600}>
            {stop.label}
        </Text>
    ) : (
        <TextLink size='sm' to={stop.to}>
            {stop.label}
        </TextLink>
    )
}

/** The route as one sentence, for screen readers. */
const describe = (route: Route): string =>
    [route.start.label, ...route.legs.map(([link, stop]) => `${link.label} to ${stop.label}`)].join(
        ', '
    )

/** One route in its own card: what sets it apart and when it was used, then the trail. */
function RouteCard({ route, now }: { readonly route: Route; readonly now: number }) {
    const last = route.legs[0]?.[0].at ?? null
    return (
        <Box tone='surface-2' padding={4} radius='md'>
            <Stack gap={3}>
                <Row gap={2} justify='between'>
                    <Text as='span' size='sm' weight={600}>
                        {route.title}
                    </Text>
                    <Text as='span' size='xs' tone='faint'>
                        {words.lastUsed} {ago(last, now)}
                    </Text>
                </Row>
                <RouteTrail label={describe(route)}>
                    <RouteStop>
                        <StopLabel stop={route.start} />
                    </RouteStop>
                    {route.legs.map(([link, stop], index) => (
                        <Fragment key={`${route.key}-${String(index)}`}>
                            <RouteLeg
                                icon={link.icon}
                                meta={link.at === null ? undefined : ago(link.at, now)}
                            >
                                {link.label}
                            </RouteLeg>
                            <RouteStop end={index === route.legs.length - 1}>
                                <StopLabel stop={stop} />
                            </RouteStop>
                        </Fragment>
                    ))}
                </RouteTrail>
            </Stack>
        </Box>
    )
}

/** Each way this node's data has reached Mesh Fire Detection, newest first. */
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
        <Stack gap={3}>
            {shown.map((route) => (
                <RouteCard key={route.key} now={now} route={route} />
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

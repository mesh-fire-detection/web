import { useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import { useConnectedNodes } from '@components/account/connectedNodes'
import { signInToSee } from '@components/account/flow'
import { ServerTime, Updated, useLive, useNow } from '@components/app/Live'
import { useRadioSnapshot } from '@components/app/RadioProvider'
import { useSession } from '@components/app/SessionProvider'
import { useUnitSystem } from '@components/app/UnitsProvider'
import { Page } from '@components/layout/Page'
import { FirmwareBuild, FirmwareVersion } from '@components/pages/build/nearby/Indicators'
import {
    expectedText,
    heardViaText,
    mapLink,
    minutesSince,
    nodeUse,
    powerText,
    STATUS_KIND,
} from '@components/pages/nodes/listing'
import { NodeEditor } from '@components/pages/nodes/NodeEditor'
import { NodePathView } from '@components/pages/nodes/NodePath'
import { NodeTelemetry } from '@components/pages/nodes/NodeTelemetry'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Box, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button, ButtonLink, TextLink } from '@components/shared/widgets/Action'
import { Badge, Metric, StatusLabel } from '@components/shared/widgets/Badge'
import { EmptyState, ErrorState } from '@components/shared/widgets/Callout'
import { fetchNode, type Node } from '@core/api/nodes'
import { nodeContent } from '@core/content/nodes/node'
import { nodesContent } from '@core/content/nodes/nodes'
import { coordinate, sinceMinutes } from '@core/format/format'
import { formatLength } from '@core/format/units'
import { meshId } from '@core/nearby/model'
import { connectedMeshIds } from '@core/nearby/radio'

const copy = nodeContent

const shownPosition = (position: readonly [number, number] | null): string =>
    position === null ? copy.unset : coordinate([position[0], position[1]])

const USE_KIND = { quiet: 'dead', unused: 'neutral' } as const

/** A node that is being heard takes its status colour, wherever it is. */
function kindOf(node: Node) {
    const use = nodeUse(node)
    return use === 'quiet' || use === 'unused' ? USE_KIND[use] : STATUS_KIND[node.status]
}

/** Whether the node is out there, what it can be done with, and whether this computer knows it. */
function UseLine({ node, now }: { readonly node: Node; readonly now: boolean }) {
    const connected = useConnectedNodes()
    const before = !now && connected.some((report) => meshId(report.nodeNum) === node.meshId)
    const onMap = mapLink([node])

    return (
        <Stack gap={3}>
            <Text size='sm' tone='muted'>
                {copy.use[nodeUse(node)].body}
                {before ? ` ${copy.connectedHere}.` : null}
            </Text>
            <Row gap={3}>
                {onMap === null ? null : (
                    <ButtonLink size='sm' to={onMap} variant='secondary'>
                        {copy.viewOnMap}
                    </ButtonLink>
                )}
                {node.mine ? (
                    <ButtonLink size='sm' to='/connect' variant='secondary'>
                        {copy.openConnect}
                    </ButtonLink>
                ) : null}
            </Row>
        </Stack>
    )
}

/** "Notecard · Cellular, 4 min ago": the path, its network when known, and when it was used. */
function connectionLine(connection: Node['connections'][number], now: number): string {
    const words = nodesContent.connections
    const network =
        connection.network === null
            ? connection.gatewayId === undefined
                ? ''
                : ` · ${copy.path.via} ${connection.gatewayId}`
            : ` · ${words.network[connection.network]}`
    const used =
        connection.lastUsedAt === null
            ? words.never
            : sinceMinutes(minutesSince(connection.lastUsedAt, now))
    return `${words.via[connection.via]}${network}, ${used}`
}

/** Recorded by the network or the node itself: nothing here is typed in. */
function Identity({ node, now }: { readonly node: Node; readonly now: number }) {
    const words = copy.identity
    return (
        <Grid gap={4} minColumnWidth={160}>
            <Metric label={words.meshId} size='sm' value={node.meshId} />
            <Metric
                label={words.roles}
                size='sm'
                value={
                    node.roles.length === 0
                        ? copy.unset
                        : node.roles.map((role) => nodesContent.roles[role]).join(', ')
                }
            />
            <Metric
                label={words.connections}
                size='sm'
                value={
                    node.connections.length === 0 ? (
                        copy.unset
                    ) : (
                        <Stack gap={1}>
                            {node.connections.map((connection) => (
                                <Text key={connection.via} as='span' size='sm'>
                                    {connectionLine(connection, now)}
                                </Text>
                            ))}
                        </Stack>
                    )
                }
            />
            <Metric label={words.hardware} size='sm' value={node.details?.hardware ?? copy.unset} />
            <Metric
                label={words.firmware}
                size='sm'
                value={<FirmwareVersion raw={node.firmware ?? ''} />}
            />
            <Metric
                label={words.build}
                size='sm'
                value={<FirmwareBuild raw={node.firmware ?? ''} />}
            />
            <Metric
                label={words.heard}
                size='sm'
                value={sinceMinutes(minutesSince(node.lastHeardAt, now))}
            />
            <Metric
                label={words.status}
                size='sm'
                value={[nodesContent.statuses[node.status], heardViaText(node)]
                    .filter((part) => part !== null)
                    .join(' · ')}
            />
            {node.expected === undefined ? null : (
                <Metric
                    label={copy.expected.label}
                    size='sm'
                    value={expectedText(node.expected, copy.expected)}
                />
            )}
            <Metric label={nodesContent.table.power} size='sm' value={powerText(node, now).text} />
        </Grid>
    )
}

/** What someone typed in when deploying the node, kept apart from what it reports. */
function DeploymentRecord({ node }: { readonly node: Node }) {
    const { system } = useUnitSystem()
    const words = copy.record
    const length = (metres: number | null, agl = false) =>
        metres === null ? copy.unset : formatLength(metres, system, { agl })

    return (
        <Stack gap={3}>
            <Stack gap={1}>
                <Heading level={2} size='sm'>
                    {words.title}
                </Heading>
                <Text size='sm' tone='muted'>
                    {words.lede}
                </Text>
            </Stack>
            <Grid gap={4} minColumnWidth={160}>
                <Metric
                    label={words.position}
                    size='sm'
                    value={
                        node.position !== null && node.approximate
                            ? `${nodesContent.approximately} ${shownPosition(node.position)}`
                            : shownPosition(node.position)
                    }
                />
                <Metric label={words.elevation} size='sm' value={length(node.elevationM)} />
                <Metric label={words.antenna} size='sm' value={length(node.antennaHeightM, true)} />
                <Metric label={words.deployed} size='sm' value={node.deployedOn ?? copy.unset} />
            </Grid>
            {node.position !== null && node.approximate ? (
                <Text size='xs' tone='faint'>
                    {copy.approximate}
                </Text>
            ) : null}
        </Stack>
    )
}

/** Who the node belongs to: names only, and only for the people on it and admins. */
function Owners({ owners }: { readonly owners: NonNullable<Node['details']>['owners'] }) {
    const words = copy.owners
    return (
        <Stack gap={3}>
            <Stack gap={1}>
                <Heading level={2} size='sm'>
                    {words.title}
                </Heading>
                <Text size='sm' tone='muted'>
                    {words.lede}
                </Text>
            </Stack>
            {owners.length === 0 ? (
                <Text size='sm' tone='faint'>
                    {words.none}
                </Text>
            ) : (
                <DescriptionList>
                    {owners.map((owner) => (
                        <DescriptionItem
                            key={`${owner.name}:${owner.addedAt}`}
                            term={`${words.added} ${owner.addedAt.slice(0, 10)}`}
                        >
                            <Row gap={2}>
                                {owner.name}
                                {owner.you ? (
                                    <Badge kind='fire' size='xs'>
                                        {words.you}
                                    </Badge>
                                ) : null}
                            </Row>
                        </DescriptionItem>
                    ))}
                </DescriptionList>
            )}
        </Stack>
    )
}

/** What only the people on a node and admins see. */
function Details({ details }: { readonly details: NonNullable<Node['details']> }) {
    const { system } = useUnitSystem()
    const words = copy.details

    return (
        <Stack gap={3}>
            <Stack gap={1}>
                <Heading level={2} size='sm'>
                    {words.title}
                </Heading>
                <Text size='sm' tone='muted'>
                    {words.lede}
                </Text>
            </Stack>
            <DescriptionList>
                <DescriptionItem term={words.position}>
                    {shownPosition(details.position)}
                </DescriptionItem>
                <DescriptionItem term={words.elevation}>
                    {details.elevationM === null
                        ? copy.unset
                        : formatLength(details.elevationM, system)}
                </DescriptionItem>
                <DescriptionItem term={words.shown}>
                    {details.exactPosition ? words.shownExact : words.shownApproximate}
                </DescriptionItem>
                <DescriptionItem term={words.hardwareId}>
                    {details.hardwareId ?? copy.unset}
                </DescriptionItem>
                <DescriptionItem term={words.registered}>
                    {details.createdAt.slice(0, 10)}
                </DescriptionItem>
                {details.reported === null ? null : (
                    <DescriptionItem term={words.reported}>
                        {[
                            details.reported.name,
                            details.reported.position === null
                                ? null
                                : coordinate([
                                      details.reported.position[0],
                                      details.reported.position[1],
                                  ]),
                            details.reported.at.slice(0, 10),
                        ]
                            .filter((part) => part !== null)
                            .join(' · ')}
                    </DescriptionItem>
                )}
            </DescriptionList>
            {details.note === null ? null : (
                <Stack gap={1}>
                    <Text as='div' mono size='xs' tone='faint' uppercase weight={600}>
                        {words.note}
                    </Text>
                    <Text measure={64} size='sm'>
                        {details.note}
                    </Text>
                </Stack>
            )}
        </Stack>
    )
}

function NodeBody({ id }: { readonly id: string }) {
    const radio = useRadioSnapshot()
    const [editing, setEditing] = useState(false)
    const [saved, setSaved] = useState(false)
    // Held while editing, so a refresh does not move the node under the form.
    const { live, retry, replace } = useLive(`node:${id}`, () => fetchNode(id), {
        paused: editing,
    })
    const clock = useNow(15_000)

    const back = (
        <Row>
            <TextLink size='sm' to='/nodes'>
                {copy.back}
            </TextLink>
        </Row>
    )

    if (live.kind !== 'ready') {
        return (
            <Page title={copy.title}>
                <Section width='narrow'>
                    <Stack gap={5}>
                        {back}
                        {live.kind === 'loading' ? (
                            <Text role='status' tone='muted'>
                                {copy.loading}
                            </Text>
                        ) : live.error === 'not_found' ? (
                            <EmptyState title={copy.notFound.title}>
                                {copy.notFound.body}
                            </EmptyState>
                        ) : (
                            <ErrorState onRetry={retry} title={copy.failed.title}>
                                {copy.failed.body}
                            </ErrorState>
                        )}
                    </Stack>
                </Section>
            </Page>
        )
    }

    const node = live.data
    // Never earlier than the answer, so an age is not shown younger than it was.
    const now = Math.max(clock, live.at)
    const here = connectedMeshIds(radio).has(node.meshId)

    return (
        <Page
            aside={
                <Stack gap={3}>
                    <Row gap={3}>
                        <StatusLabel
                            kind={kindOf(node)}
                            pulse={node.status === 'online' && nodeUse(node) !== 'unused'}
                        >
                            {copy.use[nodeUse(node)].label}
                        </StatusLabel>
                        {node.mine ? <Badge kind='fire'>{copy.yours}</Badge> : null}
                        {node.enabled ? null : <Badge>{copy.disabled}</Badge>}
                        {here ? <Badge kind='live'>{nodesContent.connectedHere}</Badge> : null}
                    </Row>
                    <Text mono size='sm' tone='faint'>
                        {[node.id, node.meshId, heardViaText(node)]
                            .filter((part) => part !== null)
                            .join(' · ')}
                    </Text>
                    <Row gap={4}>
                        {back}
                        <Updated at={live.at} />
                    </Row>
                </Stack>
            }
            title={node.name}
        >
            <Section>
                <Stack gap={4}>
                    <Box tone='surface' padding={5} radius='md'>
                        <Stack gap={5}>
                            <UseLine node={node} now={here} />
                            <Identity node={node} now={now} />
                        </Stack>
                    </Box>
                    <NodePathView node={node} />
                    <NodeTelemetry node={node} />
                    <Box tone='surface' padding={5} radius='md'>
                        <DeploymentRecord node={node} />
                    </Box>
                    {node.details === null ? null : (
                        <Box tone='surface' padding={5} radius='md'>
                            <Owners owners={node.details.owners} />
                        </Box>
                    )}
                    {editing ? (
                        <NodeEditor
                            node={node}
                            onCancel={() => {
                                setEditing(false)
                            }}
                            onSaved={(updated) => {
                                replace(updated)
                                setEditing(false)
                                setSaved(true)
                            }}
                        />
                    ) : node.details === null ? null : (
                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Details details={node.details} />
                                <Row gap={3}>
                                    <Button
                                        onClick={() => {
                                            setSaved(false)
                                            setEditing(true)
                                        }}
                                        variant='secondary'
                                    >
                                        {copy.edit.open}
                                    </Button>
                                    {saved ? (
                                        <Text role='status' size='sm' tone='live'>
                                            {copy.edit.saved}
                                        </Text>
                                    ) : null}
                                </Row>
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </Section>
        </Page>
    )
}

/** One node: what every member sees, and its details and editing for the people on it. */
export function NodePage() {
    const { session } = useSession()
    const { pathname } = useLocation()
    const { id = '' } = useParams()

    if (session.status === 'signed_out') return <Navigate replace to={signInToSee(pathname)} />
    return session.status === 'loading' ? (
        <Page title={copy.title}>{null}</Page>
    ) : (
        <ServerTime>
            <NodeBody id={id} key={id} />
        </ServerTime>
    )
}

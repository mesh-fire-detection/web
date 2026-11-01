import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import { useConnectedNodes } from '@components/account/connectedNodes'
import { signInToSee } from '@components/account/flow'
import { useSession } from '@components/app/SessionProvider'
import { useUnitSystem } from '@components/app/UnitsProvider'
import { Page } from '@components/layout/Page'
import { FirmwareBuild, FirmwareVersion } from '@components/pages/build/nearby/Indicators'
import { mapLink, minutesSince, nodeUse, STATUS_KIND } from '@components/pages/nodes/listing'
import { NodeEditor } from '@components/pages/nodes/NodeEditor'
import { NodeTelemetry } from '@components/pages/nodes/NodeTelemetry'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
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

const copy = nodeContent

type Loaded =
    | { readonly kind: 'loading' }
    | { readonly kind: 'missing' }
    | { readonly kind: 'failed' }
    | { readonly kind: 'ready'; readonly node: Node; readonly at: number }

const shownPosition = (position: readonly [number, number] | null): string =>
    position === null ? copy.unset : coordinate([position[0], position[1]])

const USE_KIND = { quiet: 'dead', unused: 'neutral' } as const

function kindOf(node: Node) {
    const use = nodeUse(node)
    return use === 'field' ? STATUS_KIND[node.status] : USE_KIND[use]
}

/** Whether the node is out there, what it can be done with, and whether this computer knows it. */
function UseLine({ node }: { readonly node: Node }) {
    const connected = useConnectedNodes()
    const here = connected.some((report) => meshId(report.nodeNum) === node.meshId)
    const onMap = mapLink([node])

    return (
        <Stack gap={3}>
            <Text size='sm' tone='muted'>
                {copy.use[nodeUse(node)].body}
                {here ? ` ${copy.connectedHere}.` : null}
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

/** Recorded by the network or the node itself: nothing here is typed in. */
function Identity({ node, now }: { readonly node: Node; readonly now: number }) {
    const words = copy.identity
    return (
        <Grid gap={4} minColumnWidth={160}>
            <Metric label={words.meshId} size='sm' value={node.meshId} />
            <Metric
                label={words.type}
                size='sm'
                value={node.type === null ? copy.unset : nodesContent.types[node.type]}
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
            <Metric label={words.status} size='sm' value={nodesContent.statuses[node.status]} />
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
                <Heading level={2} size='md'>
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
                <Heading level={2} size='md'>
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
                <Heading level={2} size='md'>
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
    const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' })
    const [attempt, setAttempt] = useState(0)
    const [editing, setEditing] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        let current = true
        void fetchNode(id).then((result) => {
            if (!current) return
            if (result.ok) setLoaded({ kind: 'ready', node: result.data, at: Date.now() })
            else setLoaded({ kind: result.error === 'not_found' ? 'missing' : 'failed' })
        })
        return () => {
            current = false
        }
    }, [id, attempt])

    const back = (
        <Row>
            <TextLink size='sm' to='/nodes'>
                {copy.back}
            </TextLink>
        </Row>
    )

    if (loaded.kind !== 'ready') {
        return (
            <Page title={copy.title}>
                <Section width='narrow'>
                    <Stack gap={5}>
                        {back}
                        {loaded.kind === 'loading' ? (
                            <Text role='status' tone='muted'>
                                {copy.loading}
                            </Text>
                        ) : loaded.kind === 'missing' ? (
                            <EmptyState title={copy.notFound.title}>
                                {copy.notFound.body}
                            </EmptyState>
                        ) : (
                            <ErrorState
                                onRetry={() => {
                                    setLoaded({ kind: 'loading' })
                                    setAttempt((count) => count + 1)
                                }}
                                title={copy.failed.title}
                            >
                                {copy.failed.body}
                            </ErrorState>
                        )}
                    </Stack>
                </Section>
            </Page>
        )
    }

    const { node, at } = loaded

    return (
        <Page
            aside={
                <Stack gap={3}>
                    <Row gap={3}>
                        <StatusLabel
                            kind={kindOf(node)}
                            pulse={nodeUse(node) === 'field' && node.status === 'online'}
                        >
                            {copy.use[nodeUse(node)].label}
                        </StatusLabel>
                        {node.mine ? <Badge kind='fire'>{copy.yours}</Badge> : null}
                        {node.enabled ? null : <Badge>{copy.disabled}</Badge>}
                    </Row>
                    <Text mono size='sm' tone='faint'>
                        {node.id} · {node.meshId}
                    </Text>
                    {back}
                </Stack>
            }
            title={node.name}
        >
            <Section>
                <Stack gap={7}>
                    <UseLine node={node} />
                    <Identity node={node} now={at} />
                    <NodeTelemetry node={node} />
                    <DeploymentRecord node={node} />
                    {node.details === null ? null : <Owners owners={node.details.owners} />}
                    {editing ? (
                        <NodeEditor
                            node={node}
                            onCancel={() => {
                                setEditing(false)
                            }}
                            onSaved={(updated) => {
                                setLoaded({ kind: 'ready', node: updated, at: Date.now() })
                                setEditing(false)
                                setSaved(true)
                            }}
                        />
                    ) : node.details === null ? null : (
                        <>
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
                        </>
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
        <NodeBody id={id} key={id} />
    )
}

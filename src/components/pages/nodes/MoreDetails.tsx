import { useEffect, useId, useState } from 'react'

import { Timestamp } from '@components/pages/build/nearby/Indicators'
import { ReadingList } from '@components/pages/build/nearby/NodeReadings'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Icon } from '@components/shared/widgets/Icon'
import { fetchNodeEvents, type Node, type NodeEvent } from '@core/api/nodes'
import { nodeContent } from '@core/content/nodes/node'
import { lastBackedUp } from '@core/nearby/backup'
import type { NearbyNode, Reading } from '@core/nearby/model'
import { createNodeMemory } from '@core/nearby/storage/nodes'
import type { Observation } from '@core/nearby/storage/observations'
import { createReadingStore } from '@core/nearby/storage/readings'

const copy = nodeContent.more

type Remembered = ReturnType<ReturnType<typeof createNodeMemory>['read']>['nodes'][number]

/** This browser's latest connection to the node; one node can be saved by Bluetooth and by USB. */
function rememberedNode(nodeNum: number | null): Remembered | null {
    try {
        return (
            createNodeMemory(() => window.localStorage)
                .read()
                .nodes.filter((node) => node.nodeNum === nodeNum)
                .toSorted((left, right) => (right.connectedAt ?? 0) - (left.connectedAt ?? 0))[0] ??
            null
        )
    } catch {
        // Private mode or blocked storage: as if nothing had been connected.
        return null
    }
}

function backedUpAt(nodeNum: number | null): number | null {
    try {
        return nodeNum === null ? null : lastBackedUp(window.localStorage, nodeNum)
    } catch {
        return null
    }
}

function EventRow({ message, at }: { readonly message: string; readonly at: number }) {
    return (
        <Row gap={3} justify='between' className='nearby_event'>
            <Text size='sm'>{message}</Text>
            <Text size='2xs' tone='faint' mono>
                <Timestamp time={at} />
            </Text>
        </Row>
    )
}

/** What browsers recorded while connected, kept for the node's people and admins. */
function ServerDetails({
    id,
    details,
    refresh,
}: {
    readonly id: string
    readonly details: NonNullable<Node['details']>
    readonly refresh: number
}) {
    const [events, setEvents] = useState<readonly NodeEvent[] | 'failed' | null>(null)

    useEffect(() => {
        let current = true
        void fetchNodeEvents(id).then((result) => {
            if (current) setEvents(result.ok ? result.data : 'failed')
        })
        return () => {
            current = false
        }
    }, [id, refresh])

    return (
        <Stack gap={5}>
            <Stack gap={3}>
                <Text size='sm' tone='muted'>
                    {copy.fromServer}
                </Text>
                <DescriptionList columns={1}>
                    <DescriptionItem term={copy.shortName}>
                        {details.shortName ?? copy.notReported}
                    </DescriptionItem>
                    {Object.entries(details.settings ?? {}).map(([label, value]) => (
                        <DescriptionItem key={label} term={label}>
                            {value}
                        </DescriptionItem>
                    ))}
                    {details.settingsReportedAt === null ? null : (
                        <DescriptionItem term={copy.settingsAsOf}>
                            <Timestamp time={Date.parse(details.settingsReportedAt)} />
                        </DescriptionItem>
                    )}
                </DescriptionList>
            </Stack>
            <Stack gap={3}>
                <Heading level={3} size='sm'>
                    {copy.events}
                </Heading>
                {events === 'failed' || events?.length === 0 ? (
                    <Text size='sm' tone='faint'>
                        {events === 'failed' ? copy.eventsFailed : copy.noEvents}
                    </Text>
                ) : (
                    <div
                        className='nearby_activity'
                        role='region'
                        aria-label={copy.events}
                        tabIndex={0}
                    >
                        {(events ?? []).map((event) => (
                            <EventRow
                                key={`${event.kind}:${event.at}`}
                                at={Date.parse(event.at)}
                                message={copy.eventKinds[event.kind]}
                            />
                        ))}
                    </div>
                )}
            </Stack>
        </Stack>
    )
}

/** What only this browser has: the activity log, and how far its backup has got. */
function LocalDetails({
    node,
    owned,
}: {
    readonly node: NearbyNode
    /** Whether the server's copy of the name and settings is already shown. */
    readonly owned: boolean
}) {
    const [remembered] = useState(() => rememberedNode(node.nodeNum))
    const [backedUp] = useState(() => backedUpAt(node.nodeNum))
    const [observation, setObservation] = useState<Observation | null>(null)

    useEffect(() => {
        if (remembered === null) return
        let current = true
        void createReadingStore(() => window.indexedDB)
            .loadObservation(remembered.id)
            .then((saved) => {
                if (current) setObservation(saved)
            })
        return () => {
            current = false
        }
    }, [remembered])

    if (remembered === null) {
        return (
            <Text size='sm' tone='faint'>
                {copy.notConnected}
            </Text>
        )
    }

    const activity = observation?.activity ?? []
    return (
        <Stack gap={5}>
            <Stack gap={3}>
                <Text size='sm' tone='muted'>
                    {copy.fromBrowser}
                </Text>
                <DescriptionList columns={1}>
                    <DescriptionItem term={copy.lastConnected}>
                        {remembered.connectedAt === null || remembered.connectedAt === undefined ? (
                            copy.notReported
                        ) : (
                            <Timestamp time={remembered.connectedAt} />
                        )}
                    </DescriptionItem>
                    {owned ? (
                        <DescriptionItem term={copy.lastBackedUp}>
                            {backedUp === null ? copy.notBackedUp : <Timestamp time={backedUp} />}
                        </DescriptionItem>
                    ) : (
                        <>
                            <DescriptionItem term={copy.shortName}>
                                {remembered.shortName ?? copy.notReported}
                            </DescriptionItem>
                            {Object.entries(observation?.configuration ?? {}).map(
                                ([label, value]) => (
                                    <DescriptionItem key={label} term={label}>
                                        {value}
                                    </DescriptionItem>
                                )
                            )}
                        </>
                    )}
                </DescriptionList>
            </Stack>
            <Stack gap={3}>
                <Heading level={3} size='sm'>
                    {copy.activity}
                </Heading>
                {activity.length === 0 ? (
                    <Text size='sm' tone='faint'>
                        {copy.noActivity}
                    </Text>
                ) : (
                    <div
                        className='nearby_activity'
                        role='region'
                        aria-label={copy.activity}
                        tabIndex={0}
                    >
                        {activity.toReversed().map((entry, index) => (
                            <EventRow
                                key={`${String(entry.at)}:${String(index)}`}
                                at={entry.at}
                                message={entry.message}
                            />
                        ))}
                    </div>
                )}
            </Stack>
        </Stack>
    )
}

/** The bottom of `/connect`: what the server kept, and what stays in this browser. */
export function MoreDetails({
    node,
    nearby,
    other,
    refresh,
}: {
    readonly node: Node
    readonly nearby: NearbyNode
    readonly other: readonly Reading[]
    /** Changes when a backup brought something new. */
    readonly refresh: number
}) {
    const [open, setOpen] = useState(false)
    const panelId = useId()

    return (
        <Stack gap={4}>
            <Button
                variant='ghost'
                size='sm'
                className='nearby_more'
                iconAfter={<Icon name='chevron' />}
                ariaExpanded={open}
                ariaControls={panelId}
                onClick={() => {
                    setOpen(!open)
                }}
            >
                {copy.open}
            </Button>
            {open ? (
                <Box tone='surface' padding={5} radius='md'>
                    <div id={panelId}>
                        <Stack gap={5}>
                            {other.length > 0 ? (
                                <Stack gap={3}>
                                    <Heading level={3} size='sm'>
                                        {copy.other}
                                    </Heading>
                                    <ReadingList readings={other} />
                                </Stack>
                            ) : null}
                            {node.details === null ? null : (
                                <ServerDetails
                                    id={node.id}
                                    details={node.details}
                                    refresh={refresh}
                                />
                            )}
                            <LocalDetails node={nearby} owned={node.details !== null} />
                        </Stack>
                    </div>
                </Box>
            ) : null}
        </Stack>
    )
}

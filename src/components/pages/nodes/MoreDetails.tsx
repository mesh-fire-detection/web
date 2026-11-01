import { useEffect, useId, useState } from 'react'

import { Timestamp } from '@components/pages/build/nearby/Indicators'
import { ReadingList } from '@components/pages/build/nearby/NodeReadings'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Icon } from '@components/shared/widgets/Icon'
import { nodeContent } from '@core/content/nodes/node'
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

/** What `/connect` saved in this browser: the server keeps no settings or activity. */
function LocalDetails({ node }: { readonly node: NearbyNode }) {
    const [remembered] = useState(() => rememberedNode(node.nodeNum))
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
                    <DescriptionItem term={copy.shortName}>
                        {remembered.shortName ?? copy.notReported}
                    </DescriptionItem>
                    <DescriptionItem term={copy.lastConnected}>
                        {remembered.connectedAt === null || remembered.connectedAt === undefined ? (
                            copy.notReported
                        ) : (
                            <Timestamp time={remembered.connectedAt} />
                        )}
                    </DescriptionItem>
                    {Object.entries(observation?.configuration ?? {}).map(([label, value]) => (
                        <DescriptionItem key={label} term={label}>
                            {value}
                        </DescriptionItem>
                    ))}
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
                            <Row
                                key={`${String(entry.at)}:${String(index)}`}
                                gap={3}
                                justify='between'
                                className='nearby_event'
                            >
                                <Text size='sm'>{entry.message}</Text>
                                <Text size='2xs' tone='faint' mono>
                                    <Timestamp time={entry.at} />
                                </Text>
                            </Row>
                        ))}
                    </div>
                )}
            </Stack>
        </Stack>
    )
}

/** The bottom of `/connect`: telemetry from the server, settings and activity from this browser. */
export function MoreDetails({
    node,
    other,
}: {
    readonly node: NearbyNode
    readonly other: readonly Reading[]
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
                            <LocalDetails node={node} />
                        </Stack>
                    </div>
                </Box>
            ) : null}
        </Stack>
    )
}

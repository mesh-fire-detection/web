import { useId, useState } from 'react'

import { Age, NodeStatus, NodeKindIcon, NodeTag } from '@components/pages/build/nearby/Indicators'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Pressable } from '@components/shared/primitives/Pressable'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { nearbyNodesContent as copy } from '@core/content/build/nearby/nearbyNodes'
import { cx } from '@core/format/cx'
import { isMfdNode, mfdKind } from '@core/nearby/firmware'
import { batteryCharge, batteryTone, readingValue } from '@core/nearby/metrics'
import { nodeName, isRecentNode } from '@core/nearby/model'
import type { NearbyNode, Snapshot, Transport } from '@core/nearby/model'
import type { NearbySession } from '@core/nearby/session'

export function NodeList({
    snapshot,
    session,
    canConnect,
    onSelect,
}: {
    readonly snapshot: Snapshot
    readonly session: NearbySession
    readonly canConnect: Readonly<Record<Transport, boolean>>
    readonly onSelect: (id: string) => void
}) {
    const [previousOpen, setPreviousOpen] = useState<boolean | null>(null)
    const previousId = useId()
    const active = snapshot.nodes.filter(
        (node) => node.state !== 'disconnected' || isRecentNode(node)
    )
    const previous = snapshot.nodes.filter(
        (node) => node.state === 'disconnected' && !isRecentNode(node)
    )
    const previousVisible =
        previousOpen ??
        (active.length === 0 &&
            (snapshot.restoration === 'unsupported' || snapshot.restoration === 'failed'))
    return (
        <Stack gap={4}>
            {snapshot.nodes.length === 0 ? (
                <Box tone='surface' padding={5} radius='md'>
                    <Stack gap={2}>
                        <Heading level={3} size='sm'>
                            {copy.emptyTitle}
                        </Heading>
                        <Text size='sm' tone='muted'>
                            {copy.emptyBody}
                        </Text>
                    </Stack>
                </Box>
            ) : (
                active.map((node) => (
                    <NodeEntry
                        key={node.id}
                        node={node}
                        snapshot={snapshot}
                        session={session}
                        canConnect={canConnect}
                        onSelect={onSelect}
                    />
                ))
            )}
            {previous.length > 0 ? (
                <Stack gap={3}>
                    <Button
                        variant='secondary'
                        ariaExpanded={previousVisible}
                        ariaControls={previousId}
                        onClick={() => {
                            setPreviousOpen(!previousVisible)
                        }}
                    >
                        {copy.previousTitle} ({previous.length})
                    </Button>
                    {previousVisible ? (
                        <div id={previousId}>
                            <Stack gap={3}>
                                <Text size='xs' tone='faint'>
                                    {snapshot.restoration
                                        ? copy.restoration[snapshot.restoration]
                                        : copy.previousBody}
                                </Text>
                                {previous.map((node) => (
                                    <NodeEntry
                                        key={node.id}
                                        node={node}
                                        snapshot={snapshot}
                                        session={session}
                                        canConnect={canConnect}
                                        onSelect={onSelect}
                                    />
                                ))}
                            </Stack>
                        </div>
                    ) : null}
                </Stack>
            ) : null}
        </Stack>
    )
}

function BatteryPercent({
    percent,
    estimated,
}: {
    readonly percent: number
    readonly estimated: boolean
}) {
    const tone = batteryTone(percent)
    const text = `${estimated ? '≈' : ''}${String(percent)} %`
    return tone === 'default' ? (
        text
    ) : (
        <Text as='span' size='xs' mono tone={tone}>
            {text}
        </Text>
    )
}

function NodeEntry({
    node,
    snapshot,
    session,
    canConnect,
    onSelect,
}: {
    readonly node: NearbyNode
    readonly snapshot: Snapshot
    readonly session: NearbySession
    readonly canConnect: Readonly<Record<Transport, boolean>>
    readonly onSelect: (id: string) => void
}) {
    const selected = snapshot.selectedId === node.id
    const name = nodeName(node) || copy.unnamed
    const battery = node.readings['deviceMetrics.batteryLevel']
    const { powered, percent } = batteryCharge(node)
    const active = node.state !== 'disconnected'
    const recent = isRecentNode(node)
    const hint =
        !active && !canConnect[node.transport]
            ? copy.unavailable[node.transport]
            : recent
              ? copy.hints.recent
              : copy.hints[node.state]
    return (
        <Box
            tone='surface'
            padding={4}
            radius='md'
            className={cx(
                'nearby_card',
                selected && 'nearby_selected',
                node.state === 'connected' && 'nearby_connected',
                recent && 'nearby_recent'
            )}
        >
            <Stack gap={3}>
                <Row gap={3} wrap={false}>
                    <NodeTag num={node.nodeNum} ours={isMfdNode(node)} />
                    <Stack gap={1} grow minWidth0>
                        <Pressable
                            className='bare nearby_select'
                            pressed={selected}
                            accessibleLabel={`${copy.actions.view}: ${name}`}
                            onActivate={() => {
                                onSelect(node.id)
                            }}
                        >
                            <Heading
                                level={3}
                                size='sm'
                                tone={recent ? 'muted' : 'default'}
                                truncate
                            >
                                {name}
                            </Heading>
                        </Pressable>
                        <NodeStatus state={node.state} recent={recent} />
                    </Stack>
                    <NodeKindIcon kind={mfdKind(node)} />
                </Row>
                <Stack gap={1}>
                    <Text mono size='xs' tone='faint' truncate>
                        {copy.transports[node.transport]} · {copy.battery}{' '}
                        {percent === null ? (
                            battery ? (
                                readingValue(battery)
                            ) : (
                                '—'
                            )
                        ) : (
                            <BatteryPercent percent={percent} estimated={powered} />
                        )}
                        {powered ? ` · ${copy.externalPower}` : null}
                    </Text>
                    <Text mono size='xs' tone='faint' truncate>
                        {copy.lastPacket}{' '}
                        {node.lastPacketAt === null ? '—' : <Age time={node.lastPacketAt} />}
                    </Text>
                    <Text size='xs' tone='faint' truncate>
                        {hint}
                    </Text>
                </Stack>
                <Row gap={2} wrap={false} className='nearby_node_actions'>
                    <Button
                        size='sm'
                        variant='secondary'
                        full
                        disabled={!active && (snapshot.busy || !canConnect[node.transport])}
                        label={`${active ? copy.actions.disconnect : copy.actions.connect}: ${name}`}
                        onClick={() => {
                            if (active) void session.disconnect(node.id)
                            else void session.connect(node.id)
                        }}
                    >
                        {active ? copy.actions.disconnect : copy.actions.connect}
                    </Button>
                    <Button
                        size='sm'
                        variant='ghost'
                        full
                        disabled={snapshot.busy}
                        label={`${copy.actions.remove}: ${name}`}
                        onClick={() => {
                            session.remove(node.id)
                        }}
                    >
                        {copy.actions.remove}
                    </Button>
                </Row>
            </Stack>
        </Box>
    )
}

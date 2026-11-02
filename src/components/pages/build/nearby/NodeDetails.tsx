import { useId, useState } from 'react'

import { FirmwareUpdate } from '@components/build/FirmwareUpdate'
import {
    Age,
    FirmwareBuild,
    FirmwareVersion,
    MeshId,
    SensorStatus,
    Timestamp,
} from '@components/pages/build/nearby/Indicators'
import {
    MetricHistoryStats,
    ReadingList,
    SensorGrid,
    SensorGuide,
    Vitals,
} from '@components/pages/build/nearby/NodeReadings'
import { PeerList } from '@components/pages/build/nearby/PeerList'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Metric } from '@components/shared/widgets/Badge'
import { Icon } from '@components/shared/widgets/Icon'
import { nearbyNodesContent } from '@core/content/build/nearby/nearbyNodes'
import { nearbyDetailsContent as copy } from '@core/content/build/nearby/nodeDetails'
import { EXPECTED_SENSOR_METRICS, isSensorMetric, SUMMARY_METRICS } from '@core/nearby/metrics'
import { isRecentNode } from '@core/nearby/model'
import type { NearbyNode } from '@core/nearby/model'
import { browserHistory } from '@core/nearby/storage/nodes'

export function NodeDetails({ node }: { readonly node: NearbyNode }) {
    const [moreOpen, setMoreOpen] = useState(false)
    const [activeMetric, setActiveMetric] = useState<string>(EXPECTED_SENSOR_METRICS[0])
    const moreId = useId()
    const recent = isRecentNode(node)
    const readings = Object.values(node.readings)
    const sensors = readings.filter((reading) => isSensorMetric(reading.metric))
    const clockUnset = sensors.length > 0 && sensors.every((reading) => reading.measuredAt === null)
    const sensorsDisabled =
        node.configuration['Environmental telemetry'] === 'Disabled' &&
        node.configuration['Particle telemetry'] === 'Disabled'
    const other = readings.filter(
        (reading) => !isSensorMetric(reading.metric) && !SUMMARY_METRICS.has(reading.metric)
    )
    const status =
        node.state === 'disconnected'
            ? recent
                ? copy.recent
                : copy.disconnected
            : node.state === 'connected'
              ? sensors.length === 0
                  ? sensorsDisabled
                      ? copy.sensorsDisabled
                      : copy.waiting
                  : copy.live
              : copy.initializing
    return (
        <Stack gap={4} minWidth0>
            <Box tone='surface' padding={5} radius='md'>
                <Stack gap={4}>
                    <div className='nearby_identity'>
                        <Metric
                            size='sm'
                            label={copy.labels.meshId}
                            value={node.nodeNum === null ? '—' : <MeshId num={node.nodeNum} />}
                        />
                        <Metric
                            size='sm'
                            label={copy.labels.connection}
                            value={
                                <span className='nearby_transport'>
                                    <Icon name={node.transport} />
                                    {nearbyNodesContent.transports[node.transport]}
                                </span>
                            }
                        />
                        <Metric
                            size='sm'
                            label={copy.labels.hardware}
                            value={node.hardware || '—'}
                        />
                        <Metric
                            size='sm'
                            label={copy.labels.firmware}
                            value={<FirmwareVersion raw={node.firmware} />}
                        />
                        <Metric
                            size='sm'
                            label={copy.labels.build}
                            value={<FirmwareBuild raw={node.firmware} />}
                        />
                        <Metric
                            size='sm'
                            label={copy.lastPacket}
                            value={
                                node.lastPacketAt === null ? '—' : <Age time={node.lastPacketAt} />
                            }
                        />
                    </div>
                    <Text size='sm' tone='muted' className='nearby_details_status'>
                        {status}
                    </Text>
                    <Vitals node={node} />
                </Stack>
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <Stack gap={4}>
                    <Heading level={3} size='sm'>
                        {copy.readings}
                    </Heading>
                    <Stack gap={0}>
                        <SensorStatus node={node} group='environment' />
                        <SensorStatus node={node} group='particles' />
                    </Stack>
                    <SensorGrid
                        readings={sensors}
                        history={node.history}
                        active={activeMetric}
                        onSelect={setActiveMetric}
                    />
                    <Text size='xs' tone='faint'>
                        {copy.timing}
                        {clockUnset ? ` ${copy.clockUnset}` : null}
                    </Text>
                </Stack>
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <MetricHistoryStats
                    metric={activeMetric}
                    history={browserHistory(node, activeMetric)}
                />
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <SensorGuide active={activeMetric} />
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <Stack gap={4}>
                    <Heading level={3} size='sm'>
                        {copy.nearest}
                    </Heading>
                    <PeerList node={node} />
                </Stack>
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <FirmwareUpdate firmware={node.firmware} />
            </Box>
            <Stack gap={4}>
                <Button
                    variant='ghost'
                    size='sm'
                    className='nearby_more'
                    iconAfter={<Icon name='chevron' />}
                    ariaExpanded={moreOpen}
                    ariaControls={moreId}
                    onClick={() => {
                        setMoreOpen(!moreOpen)
                    }}
                >
                    {copy.more}
                </Button>
                {moreOpen ? (
                    <Box tone='surface' padding={5} radius='md'>
                        <div id={moreId}>
                            <Stack gap={5}>
                                <DescriptionList columns={1}>
                                    <DescriptionItem term={copy.labels.shortName}>
                                        {node.shortName || copy.notReported}
                                    </DescriptionItem>
                                    <DescriptionItem
                                        term={
                                            node.state === 'disconnected'
                                                ? copy.labels.lastConnected
                                                : copy.labels.connectedAt
                                        }
                                    >
                                        {node.connectedAt === null ? (
                                            copy.notReported
                                        ) : (
                                            <Timestamp time={node.connectedAt} />
                                        )}
                                    </DescriptionItem>
                                    {Object.entries(node.configuration).map(([label, value]) => (
                                        <DescriptionItem key={label} term={label}>
                                            {value}
                                        </DescriptionItem>
                                    ))}
                                </DescriptionList>
                                {other.length > 0 ? (
                                    <Stack gap={3}>
                                        <Heading level={3} size='sm'>
                                            {copy.otherTelemetry}
                                        </Heading>
                                        <ReadingList readings={other} />
                                    </Stack>
                                ) : null}
                                <Stack gap={3}>
                                    <Heading level={3} size='sm'>
                                        {copy.activity}
                                    </Heading>
                                    {node.activity.length === 0 ? (
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
                                            {node.activity.toReversed().map((entry, index) => (
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
                        </div>
                    </Box>
                ) : null}
            </Stack>
        </Stack>
    )
}

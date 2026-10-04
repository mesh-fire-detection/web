import { useId, useState } from 'react'

import {
    ReadingList,
    SensorGrid,
    SensorGuide,
    Vitals,
} from '@components/pages/build/nearby/DeviceReadings'
import {
    Age,
    FirmwareBuild,
    FirmwareVersion,
    NodeId,
    SensorStatus,
    Timestamp,
} from '@components/pages/build/nearby/Indicators'
import { NearbyNodes } from '@components/pages/build/nearby/NearbyNodes'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Metric } from '@components/shared/widgets/Badge'
import { nearbyDetailsContent as copy } from '@core/content/build/nearby/deviceDetails'
import { nearbyDevicesContent } from '@core/content/build/nearby/nearbyDevices'
import { EXPECTED_SENSOR_METRICS, isSensorMetric, SUMMARY_METRICS } from '@core/nearby/metrics'
import { isRecentDevice } from '@core/nearby/model'
import type { Device } from '@core/nearby/model'

export function DeviceDetails({ device }: { readonly device: Device }) {
    const [moreOpen, setMoreOpen] = useState(false)
    const [activeMetric, setActiveMetric] = useState<string>(EXPECTED_SENSOR_METRICS[0])
    const moreId = useId()
    const recent = isRecentDevice(device)
    const readings = Object.values(device.readings)
    const sensors = readings.filter((reading) => isSensorMetric(reading.metric))
    const clockUnset = sensors.length > 0 && sensors.every((reading) => reading.measuredAt === null)
    const sensorsDisabled =
        device.configuration['Environmental telemetry'] === 'Disabled' &&
        device.configuration['Particle telemetry'] === 'Disabled'
    const other = readings.filter(
        (reading) => !isSensorMetric(reading.metric) && !SUMMARY_METRICS.has(reading.metric)
    )
    const status =
        device.state === 'disconnected'
            ? recent
                ? nearbyDevicesContent.hints.recent
                : copy.disconnected
            : device.state === 'connected'
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
                            label={copy.labels.nodeId}
                            value={device.nodeNum === null ? '—' : <NodeId num={device.nodeNum} />}
                        />
                        <Metric
                            size='sm'
                            label={copy.labels.hardware}
                            value={device.hardware || '—'}
                        />
                        <Metric
                            size='sm'
                            label={copy.labels.firmware}
                            value={<FirmwareVersion raw={device.firmware} />}
                        />
                        <Metric
                            size='sm'
                            label={copy.labels.build}
                            value={<FirmwareBuild raw={device.firmware} />}
                        />
                        <Metric
                            size='sm'
                            label={copy.lastPacket}
                            value={
                                device.lastPacketAt === null ? (
                                    '—'
                                ) : (
                                    <Age time={device.lastPacketAt} />
                                )
                            }
                        />
                    </div>
                    <Text size='sm' tone='muted' className='nearby_details_status'>
                        {status}
                    </Text>
                    <Vitals device={device} />
                </Stack>
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <Stack gap={4}>
                    <Heading level={3} size='sm'>
                        {copy.readings}
                    </Heading>
                    <Stack gap={0}>
                        <SensorStatus device={device} group='environment' />
                        <SensorStatus device={device} group='particles' />
                    </Stack>
                    <SensorGrid
                        readings={sensors}
                        history={device.history}
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
                <SensorGuide active={activeMetric} />
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <Stack gap={4}>
                    <Heading level={3} size='sm'>
                        {copy.nearest}
                    </Heading>
                    <NearbyNodes device={device} />
                </Stack>
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <Stack gap={4}>
                    <Button
                        variant='ghost'
                        size='sm'
                        ariaExpanded={moreOpen}
                        ariaControls={moreId}
                        onClick={() => {
                            setMoreOpen(!moreOpen)
                        }}
                    >
                        {copy.more}
                    </Button>
                    {moreOpen ? (
                        <div id={moreId}>
                            <Stack gap={5}>
                                <DescriptionList columns={1}>
                                    <DescriptionItem term={copy.labels.shortName}>
                                        {device.shortName || copy.notReported}
                                    </DescriptionItem>
                                    <DescriptionItem term={copy.labels.connectedAt}>
                                        {device.connectedAt === null ? (
                                            copy.notReported
                                        ) : (
                                            <Timestamp time={device.connectedAt} />
                                        )}
                                    </DescriptionItem>
                                    {Object.entries(device.configuration).map(([label, value]) => (
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
                                    {device.activity.length === 0 ? (
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
                                            {device.activity.toReversed().map((entry, index) => (
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
                    ) : null}
                </Stack>
            </Box>
        </Stack>
    )
}

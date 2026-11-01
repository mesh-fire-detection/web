import { useEffect, useState } from 'react'

import { backUpConnectedNodes } from '@components/account/nodeBackup'
import { FirmwareUpdate } from '@components/build/FirmwareUpdate'
import { SensorStatus } from '@components/pages/build/nearby/Indicators'
import {
    MetricHistoryStats,
    SensorGrid,
    SensorGuide,
    Vitals,
} from '@components/pages/build/nearby/NodeReadings'
import { MoreDetails } from '@components/pages/nodes/MoreDetails'
import { serverNode } from '@components/pages/nodes/serverNode'
import { Box, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { fetchDeviceMetrics, fetchReadings, type Node } from '@core/api/nodes'
import { nodeContent } from '@core/content/nodes/node'
import { EXPECTED_SENSOR_METRICS, isSensorMetric, SUMMARY_METRICS } from '@core/nearby/metrics'
import type { NearbyNode } from '@core/nearby/model'

const copy = nodeContent.readings

/** `/connect`'s view of a node, filled from what the server stored. */
export function NodeTelemetry({ node }: { readonly node: Node }) {
    const [nearby, setNearby] = useState<NearbyNode | 'failed' | null>(null)
    const [activeMetric, setActiveMetric] = useState<string>(EXPECTED_SENSOR_METRICS[0])
    /** Counts the backups that brought something new, so the view reloads to show it. */
    const [backups, setBackups] = useState(0)

    useEffect(() => {
        if (!node.mine) return
        let current = true
        void backUpConnectedNodes().then((stored) => {
            if (current && stored > 0) setBackups((count) => count + 1)
        })
        return () => {
            current = false
        }
    }, [node.mine])

    useEffect(() => {
        let current = true
        void Promise.all([fetchReadings(node.id), fetchDeviceMetrics(node.id)]).then(
            ([readings, metrics]) => {
                if (!current) return
                setNearby(
                    readings.ok && metrics.ok
                        ? serverNode(node, readings.data, metrics.data)
                        : 'failed'
                )
            }
        )
        return () => {
            current = false
        }
    }, [node, backups])

    if (nearby === null || nearby === 'failed') {
        return (
            <Text role='status' tone='muted'>
                {nearby === null ? copy.loading : copy.failed}
            </Text>
        )
    }

    const readings = Object.values(nearby.readings)
    const sensors = readings.filter((reading) => isSensorMetric(reading.metric))
    const other = readings.filter(
        (reading) => !isSensorMetric(reading.metric) && !SUMMARY_METRICS.has(reading.metric)
    )

    return (
        <Stack gap={4} minWidth0>
            <Vitals node={nearby} source='server' />
            <Box tone='surface' padding={5} radius='md'>
                <Stack gap={4}>
                    <Heading level={2} size='sm'>
                        {copy.sensors}
                    </Heading>
                    {node.mine ? (
                        <Stack gap={0}>
                            <SensorStatus node={nearby} group='environment' />
                            <SensorStatus node={nearby} group='particles' />
                        </Stack>
                    ) : null}
                    <SensorGrid
                        readings={sensors}
                        history={nearby.history}
                        active={activeMetric}
                        onSelect={setActiveMetric}
                    />
                    <Text size='xs' tone='faint'>
                        {copy.range}
                    </Text>
                </Stack>
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <MetricHistoryStats
                    metric={activeMetric}
                    history={{ source: 'server', samples: nearby.history[activeMetric] ?? [] }}
                />
            </Box>
            <Box tone='surface' padding={5} radius='md'>
                <SensorGuide active={activeMetric} />
            </Box>
            {node.mine ? (
                <Box tone='surface' padding={5} radius='md'>
                    <FirmwareUpdate firmware={nearby.firmware} />
                </Box>
            ) : null}
            <MoreDetails node={node} nearby={nearby} other={other} refresh={backups} />
        </Stack>
    )
}

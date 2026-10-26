import { Box, Grid, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { satelliteRangeResultsContent as copy } from '@core/content/build/satellite/panels/range'
import { satelliteRangeResults } from '@core/satellite/rangeResults'
import type { ReceiverLog } from '@core/satellite/records'

export function RangeResults({
    log,
    visible,
}: {
    readonly log: ReceiverLog
    readonly visible: boolean
}) {
    const results = satelliteRangeResults(log)
    const shouldShow = visible || results.length > 0

    return shouldShow ? (
        <Stack gap={3} className='satellite_panel'>
            <Text size='lg' weight={600}>
                {copy.title}
            </Text>
            <Text size='xs' tone='faint'>
                {copy.sortOrder}
            </Text>
            {results.length === 0 ? (
                <Text size='sm' tone='faint'>
                    {copy.empty}
                </Text>
            ) : (
                <Stack gap={2}>
                    {results.map((result) => (
                        <Box
                            key={`${result.frequencyMHz.toFixed(4)}-${String(result.bandwidthKHz)}-${String(result.spreadingFactor)}`}
                            padding={3}
                            radius='sm'
                            tone='surface'
                        >
                            <Grid minColumnWidth={115} gap={2}>
                                {[
                                    [
                                        copy.fields.frequency,
                                        `${result.frequencyMHz.toFixed(4)} MHz`,
                                    ],
                                    [copy.fields.bandwidth, `${String(result.bandwidthKHz)} kHz`],
                                    [
                                        copy.fields.spreadingFactor,
                                        `SF${String(result.spreadingFactor)}`,
                                    ],
                                    [copy.fields.cadHits, String(result.cadHits)],
                                    [copy.fields.packets, String(result.packets)],
                                    [copy.fields.timeouts, String(result.timeouts)],
                                    [copy.fields.crcErrors, String(result.crcErrors)],
                                    [copy.fields.errors, String(result.errors)],
                                    [copy.fields.bestRssi, rssiText(result.bestRssi)],
                                    [copy.fields.lastRssi, rssiText(result.lastRssi)],
                                ].map(([label, value]) => (
                                    <Stack key={label} gap={0}>
                                        <Text size='2xs' tone='faint'>
                                            {label}
                                        </Text>
                                        <Text mono size='xs'>
                                            {value}
                                        </Text>
                                    </Stack>
                                ))}
                            </Grid>
                        </Box>
                    ))}
                </Stack>
            )}
        </Stack>
    ) : null
}

function rssiText(value: number | null): string {
    return value === null ? '—' : `${value.toFixed(1)} dBm`
}

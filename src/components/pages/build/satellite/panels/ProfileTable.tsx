import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Badge } from '@components/shared/widgets/Badge'
import { satelliteProfileContent as copy } from '@core/content/build/satellite/panels/profiles'
import { satelliteProfiles, satelliteStats } from '@core/satellite/records'
import type { ReceiverLog } from '@core/satellite/records'

export function ProfileTable({ log }: { readonly log: ReceiverLog }) {
    const profiles = satelliteProfiles(log)
    const stats = new Map(satelliteStats(log).map((record) => [record.profile, record]))
    return (
        <Stack gap={3} className='satellite_panel'>
            <Text size='lg' weight={600}>
                {copy.title}
            </Text>
            {profiles.length === 0 ? (
                <Text size='sm' tone='faint'>
                    {copy.empty}
                </Text>
            ) : (
                <Stack gap={2}>
                    {profiles.map((profile) => {
                        const record = stats.get(profile.id)
                        return (
                            <Box key={profile.id} padding={3} radius='sm' tone='surface'>
                                <Stack gap={2}>
                                    <Row gap={2} justify='between'>
                                        <Text mono size='sm' weight={600}>
                                            {profile.id}
                                        </Text>
                                        <Badge
                                            kind={
                                                profile.confidence === 'observed'
                                                    ? 'live'
                                                    : 'neutral'
                                            }
                                            size='xs'
                                        >
                                            {profile.confidence}
                                        </Badge>
                                    </Row>
                                    <Grid minColumnWidth={120} gap={2}>
                                        {[
                                            [copy.fields.satellite, profile.name],
                                            [
                                                copy.fields.frequency,
                                                `${profile.frequencyMHz.toFixed(4)} MHz`,
                                            ],
                                            [
                                                copy.fields.mode,
                                                `BW ${String(profile.bandwidthKHz)} · SF${String(profile.spreadingFactor)}`,
                                            ],
                                            [copy.fields.packets, String(record?.packets ?? 0)],
                                            [copy.fields.crc, String(record?.crcErrors ?? 0)],
                                            [copy.fields.cad, String(record?.cadHits ?? 0)],
                                            [copy.fields.falseCad, String(record?.falseCad ?? 0)],
                                            [
                                                copy.fields.last,
                                                record?.lastUptime
                                                    ? `${String(record.lastUptime)} ms`
                                                    : '—',
                                            ],
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
                                </Stack>
                            </Box>
                        )
                    })}
                </Stack>
            )}
        </Stack>
    )
}

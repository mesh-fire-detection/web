import { useEffect, useState } from 'react'

import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Badge } from '@components/shared/widgets/Badge'
import { satellitePassContent as copy } from '@core/content/build/satellite/panels/passes'
import { satelliteProfiles, satellitePasses } from '@core/satellite/records'
import type { ReceiverLog } from '@core/satellite/records'

const utcFormat = new Intl.DateTimeFormat('en', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC',
})
const localFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' })

function passTime(seconds: number): string {
    const date = new Date(seconds * 1000)
    return `${utcFormat.format(date)} UTC · ${localFormat.format(date)}`
}

export function PassList({ log }: { readonly log: ReceiverLog }) {
    const profiles = new Map(satelliteProfiles(log).map((profile) => [profile.id, profile]))
    const passes = satellitePasses(log)
    const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
    const computing =
        log.entries.findLast((entry) => entry.type === 'passes')?.fields['computing'] === true

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(Math.floor(Date.now() / 1000))
        }, 30_000)
        return () => {
            window.clearInterval(interval)
        }
    }, [])

    return (
        <Stack gap={3} className='satellite_panel'>
            <Text size='lg' weight={600}>
                {copy.title}
            </Text>
            {computing ? (
                <Text size='sm' tone='muted'>
                    {copy.computing}
                </Text>
            ) : passes.length === 0 ? (
                <Text size='sm' tone='faint'>
                    {copy.empty}
                </Text>
            ) : (
                <Stack gap={2}>
                    {passes.map((pass) => {
                        const active = pass.aos <= now + 30 && pass.los >= now
                        const profile = profiles.get(pass.profile)
                        const label = profile?.name ?? pass.profile
                        return (
                            <Box
                                key={`${pass.norad}-${String(pass.aos)}`}
                                padding={3}
                                radius='sm'
                                tone='surface'
                            >
                                <Stack gap={2}>
                                    <Row gap={2}>
                                        <Text weight={600}>{label}</Text>
                                        {active ? (
                                            <Badge kind='live' size='xs'>
                                                {copy.selected}
                                            </Badge>
                                        ) : null}
                                        {pass.stale ? (
                                            <Badge kind='warn' size='xs'>
                                                {copy.fields.stale}
                                            </Badge>
                                        ) : null}
                                    </Row>
                                    <Grid minColumnWidth={200} gap={2}>
                                        {[
                                            [copy.fields.aos, pass.aos],
                                            [copy.fields.tca, pass.tca],
                                            [copy.fields.los, pass.los],
                                        ].map(([labelText, time]) => (
                                            <Stack key={String(labelText)} gap={1}>
                                                <Text size='2xs' tone='faint'>
                                                    {labelText}
                                                </Text>
                                                <Text mono size='xs'>
                                                    {passTime(Number(time))}
                                                </Text>
                                            </Stack>
                                        ))}
                                    </Grid>
                                    <Text size='xs' tone='muted'>
                                        {copy.fields.maximumElevation}:{' '}
                                        {pass.maximumElevation.toFixed(1)}° · {copy.fields.tleAge}:{' '}
                                        {String(pass.tleAgeDays)} {copy.minutes}
                                    </Text>
                                </Stack>
                            </Box>
                        )
                    })}
                </Stack>
            )}
        </Stack>
    )
}

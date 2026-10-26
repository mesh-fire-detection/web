import { Grid, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { MetricCard } from '@components/shared/widgets/Badge'
import { satelliteContent as copy } from '@core/content/build/satellite/satellite'
import { decimal } from '@core/format/format'
import { latest, numberField, textField } from '@core/satellite/records'
import type { ReceiverLog } from '@core/satellite/records'

const timeFormat = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' })

/** The station as its latest heartbeat or status record describes it. */
export function ReceiverSummary({ log }: { readonly log: ReceiverLog }) {
    const status = latest(log, 'status')
    const heartbeat = latest(log, 'hb')
    const modeEntry = latest(log, 'mode')
    const current = [status, heartbeat]
        .filter((entry) => entry !== null)
        .toSorted((left, right) => (right.at ?? 0) - (left.at ?? 0))[0]
    const field = (key: string) => (current ? numberField(current.fields, key) : null)
    const radio = status ? numberField(status.fields, 'radio') : null
    const frequency = field('freq')
    const packets = field('pkts')
    const damaged = field('crc_err')
    const noise = heartbeat ? numberField(heartbeat.fields, 'noise') : null
    const stored = field('stored')
    const mode =
        textField(modeEntry?.fields ?? {}, 'mode') ?? textField(status?.fields ?? {}, 'mode')
    const activeMode =
        textField(modeEntry?.fields ?? {}, 'active') ?? textField(status?.fields ?? {}, 'active')
    const profile =
        textField(modeEntry?.fields ?? {}, 'profile') ?? textField(status?.fields ?? {}, 'profile')
    const reason = textField(modeEntry?.fields ?? {}, 'reason')
    const heartbeatAt = heartbeat?.at ?? null
    const missing = '—'
    return (
        <Stack gap={3}>
            <Heading level={2} size='lg'>
                {copy.summaryTitle}
            </Heading>
            <Text size='sm' tone='muted'>
                {copy.summary.mode}: {mode ?? missing}
                {activeMode && activeMode !== mode ? ` · ${activeMode}` : ''}
                {profile ? ` · ${copy.summary.profile}: ${profile}` : ''}
                {reason ? ` · ${reason}` : ''}
            </Text>
            <Grid minColumnWidth={150} gap={3}>
                <MetricCard
                    label={copy.summary.radio}
                    value={
                        radio === null
                            ? missing
                            : radio === 0
                              ? copy.summary.listening
                              : `${copy.summary.fault} ${String(radio)}`
                    }
                    tone={radio === null ? 'faint' : radio === 0 ? 'live' : 'dead'}
                />
                <MetricCard
                    label={copy.summary.frequency}
                    value={frequency === null ? missing : `${decimal(frequency, 3)} MHz`}
                />
                <MetricCard
                    label={copy.summary.packets}
                    value={packets === null ? missing : String(packets)}
                    tone={packets ? 'live' : 'default'}
                />
                <MetricCard
                    label={copy.summary.damaged}
                    value={damaged === null ? missing : String(damaged)}
                    tone={damaged ? 'warn' : 'default'}
                />
                <MetricCard
                    label={copy.summary.stored}
                    value={stored === null ? missing : String(stored)}
                />
                <MetricCard
                    label={copy.summary.noise}
                    value={noise === null ? missing : `${decimal(noise, 1)} dBm`}
                />
                <MetricCard
                    label={copy.summary.lastHeartbeat}
                    value={
                        heartbeatAt === null ? copy.summary.notYet : timeFormat.format(heartbeatAt)
                    }
                    tone={heartbeat ? 'default' : 'faint'}
                />
            </Grid>
        </Stack>
    )
}

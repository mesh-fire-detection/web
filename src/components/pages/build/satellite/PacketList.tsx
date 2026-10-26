import { useState } from 'react'

import { Timeline, TimelineItem } from '@components/shared/page/Timeline'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { CodeBlock, Text, type Tone } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { packetListContent as copy } from '@core/content/build/satellite/packetList'
import { decimal, signed } from '@core/format/format'
import {
    asPacket,
    numberField,
    PACKET_CRC_MISMATCH,
    PACKET_OK,
    textField,
} from '@core/satellite/records'
import type { ReceiverEntry, ReceiverPacket } from '@core/satellite/records'

const timeFormat = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
})

/** A stored packet from a boot the page never synced has only the board's uptime. */
function receivedAt(entry: ReceiverEntry): string {
    if (entry.at !== null) return timeFormat.format(entry.at)
    const minutes = Math.floor(entry.uptime / 60_000)
    return `${copy.unknownTime} · ${copy.boot} ${String(entry.boot ?? '?')}, ${String(minutes)} min`
}

function packetStatus(packet: ReceiverPacket): {
    readonly label: string
    readonly tone: Tone
} {
    if (packet.status === PACKET_OK) return { label: copy.status.ok, tone: 'live' }
    return packet.status === PACKET_CRC_MISMATCH
        ? { label: copy.status.damaged, tone: 'warn' }
        : { label: `${copy.status.error} ${String(packet.status)}`, tone: 'dead' }
}

function measure(value: number, unit: string, places: number, withSign = false): string {
    return Number.isNaN(value)
        ? '—'
        : `${withSign ? signed(value, places) : decimal(value, places)} ${unit}`
}

/** Byte pairs in groups of eight, so a payload can be read and compared by eye. */
function groupHex(hex: string): string {
    return (hex.match(/.{1,16}/gu) ?? [])
        .map((group) => group.replaceAll(/(..)(?!$)/gu, '$1 '))
        .join('\n')
}

function JsonToggle({ entry }: { readonly entry: ReceiverEntry }) {
    const [open, setOpen] = useState(false)
    return (
        <Stack gap={2}>
            <Row gap={2}>
                <Button
                    size='sm'
                    variant='ghost'
                    ariaExpanded={open}
                    onClick={() => {
                        setOpen(!open)
                    }}
                >
                    {open ? copy.hideJson : copy.showJson}
                </Button>
            </Row>
            {open ? <CodeBlock>{JSON.stringify(entry.fields, null, 2)}</CodeBlock> : null}
        </Stack>
    )
}

function PacketCard({
    entry,
    fresh,
    satelliteNames,
}: {
    readonly entry: ReceiverEntry
    readonly fresh: boolean
    readonly satelliteNames: ReadonlyMap<string, string>
}) {
    const packet = asPacket(entry)
    if (!packet) return null
    const status = packetStatus(packet)
    const profile = textField(entry.fields, 'profile')
    const mode = textField(entry.fields, 'mode')
    const predictedDoppler = numberField(entry.fields, 'df_pred')
    const profileRecord = profile ? satelliteNames.get(profile) : null
    return (
        <Box
            accent={fresh ? 'live' : undefined}
            padding={4}
            radius='md'
            tone={fresh ? 'live' : 'surface'}
        >
            <Stack gap={3}>
                <Row gap={3} justify='between'>
                    <Text weight={600} tone={status.tone}>
                        {status.label}
                    </Text>
                    <Text size='xs' tone='faint' mono>
                        {receivedAt(entry)}
                        {entry.replayed ? ` · ${copy.replayed}` : ''}
                    </Text>
                </Row>
                <Row gap={5}>
                    {[
                        [copy.fields.rssi, measure(packet.rssi, 'dBm', 1)],
                        [copy.fields.snr, measure(packet.snr, 'dB', 1)],
                        [copy.fields.offset, measure(packet.frequencyError, 'Hz', 0, true)],
                        [copy.fields.length, `${String(packet.length)} B`],
                    ].map(([label, value]) => (
                        <Stack key={label} gap={0}>
                            <Text size='2xs' tone='faint'>
                                {label}
                            </Text>
                            <Text mono size='sm'>
                                {value}
                            </Text>
                        </Stack>
                    ))}
                </Row>
                {profile || mode || predictedDoppler !== null ? (
                    <Row gap={3}>
                        {profile ? (
                            <Text size='xs' tone='muted'>
                                {copy.fields.profile}: {profile}
                            </Text>
                        ) : null}
                        {profileRecord ? (
                            <Text size='xs' tone='muted'>
                                {copy.fields.satellite}: {profileRecord}
                            </Text>
                        ) : null}
                        {mode ? (
                            <Text size='xs' tone='muted'>
                                {copy.fields.mode}: {mode}
                            </Text>
                        ) : null}
                        {predictedDoppler === null ? null : (
                            <Text size='xs' tone='muted'>
                                {copy.fields.doppler}: {measure(predictedDoppler, 'Hz', 0, true)}
                            </Text>
                        )}
                    </Row>
                ) : null}
                <Stack gap={1}>
                    <Text size='2xs' tone='faint'>
                        {copy.payload}
                    </Text>
                    <CodeBlock>{packet.hex ? groupHex(packet.hex) : copy.emptyPayload}</CodeBlock>
                </Stack>
                <JsonToggle entry={entry} />
            </Stack>
        </Box>
    )
}

export function PacketList({
    entries,
    freshId,
    satelliteNames,
}: {
    readonly entries: readonly ReceiverEntry[]
    readonly freshId: number | null
    readonly satelliteNames: ReadonlyMap<string, string>
}) {
    const packets = entries.filter((entry) => entry.type === 'pkt').toReversed()
    return packets.length === 0 ? (
        <Text size='sm' tone='faint'>
            {copy.emptyPackets}
        </Text>
    ) : (
        <Stack gap={3}>
            {packets.map((entry) => (
                <PacketCard
                    key={entry.id}
                    entry={entry}
                    fresh={entry.id === freshId}
                    satelliteNames={satelliteNames}
                />
            ))}
        </Stack>
    )
}

/** One line per record type, so a long run of heartbeats stays scannable. */
function recordSummary(entry: ReceiverEntry): string {
    const field = (key: string) => numberField(entry.fields, key)
    const value = (key: string, unit = '', places = 0) => {
        const number = field(key)
        return number === null ? '—' : `${decimal(number, places)}${unit}`
    }
    switch (entry.type) {
        case 'pkt': {
            const packet = asPacket(entry)
            return packet
                ? `${packetStatus(packet).label} · ${measure(packet.rssi, 'dBm', 1)} · ${String(packet.length)} B`
                : ''
        }
        case 'hb': {
            const words = copy.summary
            return `${words.noise} ${value('noise', ' dBm', 1)} · ${value('pkts')} ${words.ok} · ${value('crc_err')} ${words.crc}`
        }
        case 'status': {
            return `${copy.summary.radio} ${value('radio')} · ${value('freq', ' MHz', 3)} · SF${value('sf')} · BW ${value('bw', ' kHz', 1)}`
        }
        case 'boot': {
            return `${copy.summary.radio} ${value('radio')}`
        }
        case 'history': {
            return `${value('count')} ${copy.summary.replayed}`
        }
        case 'cad': {
            const result = textField(entry.fields, 'result') ?? '—'
            const profile = textField(entry.fields, 'profile')
            const frequency = value('freq', ' MHz', 4)
            const bandwidth = value('bw', ' kHz', 1)
            const spreadingFactor = value('sf')
            return `${result}${profile ? ` · ${profile}` : ` · BW ${bandwidth} · SF${spreadingFactor}`} · ${frequency}`
        }
        default: {
            return Object.keys(entry.fields)
                .filter((key) => key !== 'type' && key !== 't')
                .join(', ')
        }
    }
}

export function RecordList({ entries }: { readonly entries: readonly ReceiverEntry[] }) {
    return entries.length === 0 ? (
        <Text size='sm' tone='faint'>
            {copy.emptyRecords}
        </Text>
    ) : (
        <Timeline>
            {entries.toReversed().map((entry) => (
                <TimelineItem
                    key={entry.id}
                    metaWidth='lg'
                    meta={
                        <Row gap={3}>
                            <Badge kind='neutral' size='xs' uppercase={false}>
                                {entry.type}
                            </Badge>
                            <Text as='span' mono size='xs' tone='faint'>
                                {receivedAt(entry)}
                            </Text>
                        </Row>
                    }
                >
                    <Text size='sm' tone='muted'>
                        {recordSummary(entry)}
                    </Text>
                    <JsonToggle entry={entry} />
                </TimelineItem>
            ))}
        </Timeline>
    )
}

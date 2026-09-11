import type { MeshNode } from '@/data/network'
import { LINKS, findNode, linkQuality } from '@/data/network'
import { coordinate, sinceMinutes } from '@/lib/format'
import {
    Badge,
    Box,
    Button,
    Divider,
    Grid,
    Heading,
    Icon,
    Metric,
    Row,
    Stack,
    StatusLabel,
    Text,
} from '@/ui'

const STATUS_KIND = { online: 'live', degraded: 'warn', offline: 'dead' } as const

export function NodePanel({ node, onClose }: { node: MeshNode; onClose: () => void }) {
    const neighbours = LINKS.filter((link) => link.from === node.id || link.to === node.id)

    return (
        <Box tone='surface-2' padding={4} radius='md' className='node_panel'>
            <Stack gap={4}>
                <Row justify='between' align='start' gap={3} wrap={false}>
                    <Stack gap={2} minWidth0>
                        <StatusLabel
                            kind={STATUS_KIND[node.status]}
                            pulse={node.status === 'online'}
                        >
                            {node.status}
                        </StatusLabel>
                        <Heading level={3} size='md'>
                            {node.name}
                        </Heading>
                        <Text size='2xs' mono tone='faint'>
                            {node.id} · {coordinate(node.position)}
                        </Text>
                    </Stack>
                    <Button variant='ghost' size='sm' label='Close node details' onClick={onClose}>
                        <Icon name='close' size={16} />
                    </Button>
                </Row>

                <Divider space={0} />

                <Grid columns={2} gap={4}>
                    <Metric label='Type' value={node.type} size='sm' />
                    <Metric
                        label='Battery'
                        value={node.batteryPct === null ? '—' : `${node.batteryPct}%`}
                        size='sm'
                        tone={
                            node.batteryPct === null
                                ? 'muted'
                                : node.batteryPct < 25
                                  ? 'dead'
                                  : 'default'
                        }
                    />
                    <Metric
                        label='Last heard'
                        value={sinceMinutes(node.lastHeartbeatMin)}
                        size='sm'
                    />
                    <Metric label='Antenna' value={`${node.antennaHeightM} m AGL`} size='sm' />
                    <Metric label='Elevation' value={`${node.elevationM} m`} size='sm' />
                    <Metric label='Firmware' value={node.firmware} size='sm' />
                </Grid>

                {neighbours.length > 0 ? (
                    <Stack gap={2}>
                        <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                            Links
                        </Text>
                        {neighbours.map((link) => {
                            const otherId = link.from === node.id ? link.to : link.from
                            const other = findNode(otherId)
                            const quality = linkQuality(link.snr)
                            return (
                                <Row
                                    key={`${link.from}-${link.to}`}
                                    justify='between'
                                    gap={2}
                                    wrap={false}
                                >
                                    <Text as='span' size='xs' tone='muted' clamp={1}>
                                        {other?.name ?? otherId}
                                    </Text>
                                    <Row gap={2} wrap={false}>
                                        <Text as='span' size='2xs' mono tone='faint'>
                                            {link.distanceKm} km
                                        </Text>
                                        <Badge
                                            kind={
                                                quality === 'good'
                                                    ? 'live'
                                                    : quality === 'marginal'
                                                      ? 'warn'
                                                      : 'dead'
                                            }
                                            size='xs'
                                        >
                                            {link.snr} dB
                                        </Badge>
                                    </Row>
                                </Row>
                            )
                        })}
                    </Stack>
                ) : (
                    <Text size='xs' tone='dead'>
                        No links. This node is unreachable.
                    </Text>
                )}

                {node.note ? (
                    <Text size='xs' tone='muted' measure={54}>
                        {node.note}
                    </Text>
                ) : null}
            </Stack>
        </Box>
    )
}

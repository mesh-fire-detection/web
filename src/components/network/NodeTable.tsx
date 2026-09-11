import type { MeshNode } from '@/data/network'
import { NODES } from '@/data/network'
import { coordinate, sinceMinutes } from '@/lib/format'
import type { Column } from '@/ui'
import { Badge, BareButton, DataTable, Row, Stack, StatusDot, Text, Value } from '@/ui'

const STATUS_KIND = { online: 'live', degraded: 'warn', offline: 'dead' } as const

export function NodeTable({
    selectedId,
    onSelect,
}: {
    selectedId: string | null
    onSelect: (node: MeshNode) => void
}) {
    const columns: readonly Column<MeshNode>[] = [
        {
            key: 'name',
            header: 'Node',
            render: (node) => (
                <BareButton
                    className='node_row'
                    onClick={() => {
                        onSelect(node)
                    }}
                >
                    <Row gap={3} wrap={false}>
                        <StatusDot
                            kind={STATUS_KIND[node.status]}
                            pulse={node.status === 'online'}
                        />
                        <Stack gap={0} minWidth0 align='start'>
                            <Text
                                as='span'
                                size='sm'
                                weight={600}
                                tone={selectedId === node.id ? 'fire' : 'default'}
                            >
                                {node.name}
                            </Text>
                            <Text as='span' size='2xs' mono tone='faint'>
                                {coordinate(node.position)}
                            </Text>
                        </Stack>
                    </Row>
                </BareButton>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            render: (node) => <Badge>{node.type}</Badge>,
        },
        {
            key: 'battery',
            header: 'Battery',
            align: 'end',
            render: (node) =>
                node.batteryPct === null ? (
                    <Value tone='faint'>—</Value>
                ) : (
                    <Value
                        tone={
                            node.batteryPct < 25
                                ? 'dead'
                                : node.batteryPct < 50
                                  ? 'warn'
                                  : 'default'
                        }
                    >
                        {node.batteryPct}%
                    </Value>
                ),
        },
        {
            key: 'heard',
            header: 'Last heard',
            align: 'end',
            render: (node) => (
                <Value
                    tone={
                        node.lastHeartbeatMin === null || node.lastHeartbeatMin > 60
                            ? 'dead'
                            : 'muted'
                    }
                >
                    {sinceMinutes(node.lastHeartbeatMin)}
                </Value>
            ),
        },
        {
            key: 'antenna',
            header: 'Ant. AGL',
            align: 'end',
            render: (node) => <Value tone='muted'>{node.antennaHeightM} m</Value>,
        },
        {
            key: 'deployed',
            header: 'Deployed',
            align: 'end',
            render: (node) => <Value tone='faint'>{node.deployedOn}</Value>,
        },
    ]

    return (
        <DataTable
            columns={columns}
            rows={NODES}
            getRowKey={(node) => node.id}
            caption='Ordered from the branch head outward.'
        />
    )
}

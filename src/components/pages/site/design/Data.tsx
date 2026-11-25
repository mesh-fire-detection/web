import { useState } from 'react'

import { Group, Specimen } from '@components/pages/site/design/Specimen'
import { SearchField } from '@components/shared/forms/Field'
import { CollectionToolbar } from '@components/shared/page/CollectionToolbar'
import { DataTable, type Column } from '@components/shared/page/DataTable'
import {
    DescriptionItem,
    DescriptionList,
    List,
    ListItem,
    SettingList,
    SettingRow,
} from '@components/shared/page/List'
import { StepItem, StepList } from '@components/shared/page/StepList'
import {
    RouteLeg,
    RouteStop,
    RouteTrail,
    Timeline,
    TimelineItem,
} from '@components/shared/page/Timeline'
import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Badge, StatusLabel } from '@components/shared/widgets/Badge'
import { Icon, type IconName } from '@components/shared/widgets/Icon'
import { LineChart, Sparkline, type ChartPoint } from '@components/shared/widgets/LineChart'

type Node = { readonly name: string; readonly status: 'Online' | 'Offline'; readonly rssi: number }

const NODES: readonly Node[] = [
    { name: 'Sensor', status: 'Online', rssi: -88 },
    { name: 'Gateway', status: 'Offline', rssi: -112 },
    { name: 'Relay', status: 'Online', rssi: -97 },
]
const COLUMNS: readonly Column<Node>[] = [
    { key: 'name', header: 'Name', render: (row) => row.name, sortValue: (row) => row.name },
    {
        key: 'status',
        header: 'Status',
        render: (row) => (
            <StatusLabel kind={row.status === 'Online' ? 'live' : 'dead'}>{row.status}</StatusLabel>
        ),
        sortValue: (row) => row.status,
    },
    {
        key: 'rssi',
        header: 'Signal',
        align: 'end',
        render: (row) => `${String(row.rssi)} dBm`,
        sortValue: (row) => row.rssi,
    },
]
const ICONS: readonly IconName[] = [
    'map',
    'build',
    'coverage',
    'problem',
    'github',
    'discord',
    'arrow-right',
    'arrow-up-right',
    'download',
    'radio',
    'camera',
    'sensor',
    'cell',
    'battery',
    'menu',
    'close',
    'check',
    'alert',
    'chevron',
    'bluetooth',
    'usb',
    'flask',
    'person',
    'wifi',
]
const HOUR = 3_600_000
const START = Date.UTC(2026, 0, 1)
const POINTS: readonly ChartPoint[] = [4.12, 4.08, 4.05, 3.99, 4.01, 3.96, 3.93, 3.95, 3.91].map(
    (value, index) => ({ value, at: START + index * HOUR })
)
const FLAT: readonly ChartPoint[] = [3.9, 3.9, 3.9].map((value, index) => ({
    value,
    at: START + index * HOUR,
}))

function sorted(rows: readonly Node[], key: string | null, ascending: boolean): readonly Node[] {
    const column = COLUMNS.find((candidate) => candidate.key === key)
    if (!column?.sortValue) return rows
    const value = column.sortValue
    return rows.toSorted((left, right) => {
        const a = value(left) ?? ''
        const b = value(right) ?? ''
        const order = a < b ? -1 : a > b ? 1 : 0
        return ascending ? order : -order
    })
}

function Tables() {
    const [filter, setFilter] = useState('')
    const [sortKey, setSortKey] = useState<string | null>('name')
    const [ascending, setAscending] = useState(true)
    const shown = sorted(
        NODES.filter((node) => node.name.toLowerCase().includes(filter.toLowerCase())),
        sortKey,
        ascending
    )
    return (
        <>
            <Group label='Collection toolbar with sortable table'>
                <CollectionToolbar resultCount={shown.length} itemLabel='node'>
                    <SearchField label='Filter nodes' value={filter} onChange={setFilter} />
                </CollectionToolbar>
                <DataTable
                    label='Sortable nodes'
                    columns={COLUMNS}
                    rows={shown}
                    getRowKey={(row) => row.name}
                    sort={{
                        key: sortKey,
                        direction: ascending ? 'ascending' : 'descending',
                        onChange: (key) => {
                            setAscending(key === sortKey ? !ascending : true)
                            setSortKey(key)
                        },
                    }}
                />
            </Group>
            <Group label='Caption, footer and dense'>
                <DataTable
                    caption='Nodes heard in the last hour'
                    columns={COLUMNS}
                    rows={NODES}
                    getRowKey={(row) => row.name}
                    footer={
                        <Text size='xs' tone='faint'>
                            Signal is the last packet's RSSI.
                        </Text>
                    }
                    dense
                />
            </Group>
            <Group label='Empty: default and custom'>
                <DataTable
                    label='Empty table'
                    columns={COLUMNS}
                    rows={[]}
                    getRowKey={(row) => row.name}
                />
                <DataTable
                    label='Empty table with custom content'
                    columns={COLUMNS}
                    rows={[]}
                    getRowKey={(row) => row.name}
                    emptyContent={
                        <Text size='sm' tone='muted'>
                            No nodes heard yet. Power one on nearby.
                        </Text>
                    }
                />
            </Group>
        </>
    )
}

export function Data() {
    return (
        <Specimen title='Data and content'>
            <Tables />
            <Group label='List markers'>
                <Grid minColumnWidth={160} gap={4}>
                    {(['dash', 'dot', 'number', 'none'] as const).map((marker) => (
                        <Stack key={marker} gap={2}>
                            <Text size='2xs' mono tone='faint'>
                                {marker}
                            </Text>
                            <List marker={marker}>
                                <ListItem>List item</ListItem>
                                <ListItem>Another item</ListItem>
                            </List>
                        </Stack>
                    ))}
                </Grid>
            </Group>
            <Group label='List item tones and sizes; list gap'>
                <Grid columns={2} gap={4}>
                    <List>
                        <ListItem tone='default'>Default tone</ListItem>
                        <ListItem tone='muted'>Muted tone</ListItem>
                        <ListItem tone='faint'>Faint tone</ListItem>
                    </List>
                    <List gap={4}>
                        <ListItem size='sm'>Small, gap 4</ListItem>
                        <ListItem size='md'>Medium, gap 4</ListItem>
                    </List>
                </Grid>
            </Group>
            <Group label='Description list: one and two columns'>
                <Grid columns={2} gap={4}>
                    <DescriptionList>
                        <DescriptionItem term='Type'>Sensor</DescriptionItem>
                        <DescriptionItem term='Status'>Online</DescriptionItem>
                    </DescriptionList>
                    <DescriptionList columns={2}>
                        <DescriptionItem term='Type'>Sensor</DescriptionItem>
                        <DescriptionItem term='Status'>Online</DescriptionItem>
                        <DescriptionItem term='Battery'>3.91 V</DescriptionItem>
                        <DescriptionItem term='Firmware'>2.7.26</DescriptionItem>
                    </DescriptionList>
                </Grid>
            </Group>
            <Group label='Setting list'>
                <SettingList
                    title='Account'
                    action={
                        <Button size='sm' variant='ghost'>
                            Edit
                        </Button>
                    }
                >
                    <SettingRow label='Email' description='Where alerts are sent.'>
                        <Text size='sm' mono>
                            name@example.com
                        </Text>
                    </SettingRow>
                    <SettingRow
                        label='Alerts'
                        description='Smoke and offline notices.'
                        action={<Badge kind='live'>On</Badge>}
                    />
                    <SettingRow
                        label='Leave'
                        description='Action aligned to the end.'
                        align='end'
                        action={
                            <Button size='sm' variant='danger'>
                                Leave
                            </Button>
                        }
                    />
                </SettingList>
            </Group>
            <Group label='Step list'>
                <StepList>
                    <StepItem index={1}>Flash the firmware</StepItem>
                    <StepItem index={2}>Pair over Bluetooth</StepItem>
                    <StepItem index={3}>Mount on a ridge</StepItem>
                </StepList>
            </Group>
            <Group label='Timeline: meta widths sm, md, lg'>
                <Timeline>
                    <TimelineItem meta='Now' metaWidth='sm'>
                        Short meta
                    </TimelineItem>
                    <TimelineItem meta='Today'>Medium meta (default)</TimelineItem>
                    <TimelineItem meta='12 Mar 2026' metaWidth='lg'>
                        Long meta
                    </TimelineItem>
                </Timeline>
            </Group>
            <Group label='Route trail'>
                <RouteTrail label='Sensor, by radio to relay, by radio to gateway, by cellular to the server'>
                    <RouteStop>Sensor</RouteStop>
                    <RouteLeg icon='radio' meta='2 min ago'>
                        Radio
                    </RouteLeg>
                    <RouteStop>Relay</RouteStop>
                    <RouteLeg icon='radio'>Radio</RouteLeg>
                    <RouteStop>Gateway</RouteStop>
                    <RouteLeg icon='cell'>Cellular</RouteLeg>
                    <RouteStop end>Server</RouteStop>
                </RouteTrail>
            </Group>
            <Group label='Line chart (hover for readout) and a flat series'>
                <Grid columns={2} gap={4}>
                    <LineChart
                        points={POINTS}
                        label='Battery voltage'
                        latestLabel='Latest'
                        formatValue={(value) => `${value.toFixed(2)} V`}
                        formatTime={(at) => new Date(at).toISOString().slice(11, 16)}
                    />
                    <LineChart
                        points={FLAT}
                        label='Flat battery voltage'
                        latestLabel='Latest'
                        formatValue={(value) => `${value.toFixed(2)} V`}
                        formatTime={(at) => new Date(at).toISOString().slice(11, 16)}
                    />
                </Grid>
            </Group>
            <Group label='Sparkline: series, flat, empty (keeps its space)'>
                <Grid columns={3} gap={4}>
                    <Box>
                        <Sparkline points={POINTS} />
                    </Box>
                    <Box>
                        <Sparkline points={FLAT} />
                    </Box>
                    <Box>
                        <Sparkline points={[]} />
                    </Box>
                </Grid>
            </Group>
        </Specimen>
    )
}

export function Icons() {
    return (
        <Specimen title='Icons'>
            <Group label='Set'>
                <Row gap={5}>
                    {ICONS.map((name) => (
                        <Stack key={name} align='center' gap={1}>
                            <Icon name={name} size={24} />
                            <Text size='2xs' tone='faint'>
                                {name}
                            </Text>
                        </Stack>
                    ))}
                </Row>
            </Group>
            <Group label='Sizes'>
                <Row gap={5} align='end'>
                    {[12, 16, 20, 24, 32, 48].map((size) => (
                        <Stack key={size} align='center' gap={1}>
                            <Icon name='sensor' size={size} />
                            <Text size='2xs' mono tone='faint'>
                                {size}
                            </Text>
                        </Stack>
                    ))}
                </Row>
            </Group>
            <Group label='Tones'>
                <Row gap={5}>
                    {(['default', 'muted', 'faint', 'fire', 'live', 'warn', 'dead'] as const).map(
                        (tone) => (
                            <Stack key={tone} align='center' gap={1}>
                                <Icon name='alert' size={24} tone={tone} label={`Alert, ${tone}`} />
                                <Text size='2xs' mono tone='faint'>
                                    {tone}
                                </Text>
                            </Stack>
                        )
                    )}
                </Row>
            </Group>
        </Specimen>
    )
}

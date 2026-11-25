import { useState } from 'react'

import { Group, Specimen } from '@components/pages/site/design/Specimen'
import { MetricGrid } from '@components/shared/page/MetricGrid'
import { Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import {
    Badge,
    Metric,
    MetricCard,
    StatusDot,
    StatusLabel,
    type StatusKind,
} from '@components/shared/widgets/Badge'
import { Callout, EmptyState, ErrorState } from '@components/shared/widgets/Callout'
import { CostComparison } from '@components/shared/widgets/CostComparison'
import { SampleDataBanner } from '@components/shared/widgets/SampleDataBanner'

const KINDS: readonly StatusKind[] = ['live', 'warn', 'dead', 'fire', 'neutral']
const METRIC_TONES = ['default', 'muted', 'faint', 'fire', 'live', 'warn', 'dead'] as const
const CALLOUT_TONES = ['fire', 'warn', 'live', 'dead'] as const

export function Feedback() {
    const [retries, setRetries] = useState(0)
    return (
        <Specimen title='Status and feedback'>
            <Group label='Badge kinds'>
                <Row gap={3}>
                    {KINDS.map((kind) => (
                        <Badge kind={kind} key={kind}>
                            {kind}
                        </Badge>
                    ))}
                </Row>
            </Group>
            <Group label='Badge options: size xs, mono, uppercase'>
                <Row gap={3} align='center'>
                    <Badge size='xs'>Extra small</Badge>
                    <Badge size='sm'>Small</Badge>
                    <Badge mono>v2.7.26</Badge>
                    <Badge uppercase kind='fire'>
                        Uppercase
                    </Badge>
                </Row>
            </Group>
            <Group label='Status dot: still and pulsing'>
                <Row gap={5}>
                    {KINDS.map((kind) => (
                        <Row key={kind} gap={2} wrap={false}>
                            <StatusDot kind={kind} />
                            <StatusDot kind={kind} pulse />
                            <Text as='span' size='xs' mono tone='faint'>
                                {kind}
                            </Text>
                        </Row>
                    ))}
                </Row>
            </Group>
            <Group label='Status label: kinds, pulse, truncate'>
                <Stack gap={2}>
                    <Row gap={5}>
                        <StatusLabel kind='live'>Online</StatusLabel>
                        <StatusLabel kind='warn'>Late</StatusLabel>
                        <StatusLabel kind='dead'>Offline</StatusLabel>
                        <StatusLabel kind='fire'>Smoke</StatusLabel>
                        <StatusLabel kind='neutral'>Unknown</StatusLabel>
                        <StatusLabel kind='live' pulse>
                            Listening
                        </StatusLabel>
                    </Row>
                    <Stack gap={0} minWidth0>
                        <StatusLabel kind='warn' truncate>
                            Last heard a long while ago from a node far down the valley past the
                            second ridge and the old fire lookout
                        </StatusLabel>
                    </Stack>
                </Stack>
            </Group>
            <Group label='Metric: sizes'>
                <MetricGrid>
                    <Metric label='Small' value='42' size='sm' />
                    <Metric label='Medium' value='42' size='md' />
                    <Metric label='Large' value='42' size='lg' />
                    <Metric label='With hint' value='3.91 V' hint='Full at 4.2 V' />
                </MetricGrid>
            </Group>
            <Group label='Metric card: tones'>
                <MetricGrid>
                    {METRIC_TONES.map((tone) => (
                        <MetricCard key={tone} label={tone} value='−90 dBm' tone={tone} />
                    ))}
                </MetricGrid>
            </Group>
            <Group label='Callout: default and tones'>
                <Stack gap={3}>
                    <Callout title='Default'>A shared callout.</Callout>
                    {CALLOUT_TONES.map((tone) => (
                        <Callout key={tone} title={`Tone ${tone}`} tone={tone}>
                            A {tone} callout.
                        </Callout>
                    ))}
                    <Callout title='Custom icon' icon='battery' tone='warn'>
                        Battery below 20%.
                    </Callout>
                </Stack>
            </Group>
            <Group label='Empty state: plain and with action'>
                <Stack gap={3}>
                    <EmptyState title='Nothing here'>No items match the current filter.</EmptyState>
                    <EmptyState
                        title='No nodes yet'
                        action={<Button variant='secondary'>Connect a node</Button>}
                    >
                        Nodes you connect appear here.
                    </EmptyState>
                </Stack>
            </Group>
            <Group label='Error state: without retry, with retry, custom label'>
                <Stack gap={3}>
                    <ErrorState title='Unable to load'>The server did not answer.</ErrorState>
                    <ErrorState
                        title='Unable to load'
                        onRetry={() => {
                            setRetries((value) => value + 1)
                        }}
                    >
                        Retried {retries} times.
                    </ErrorState>
                    <ErrorState
                        title='Connection lost'
                        retryLabel='Reconnect'
                        onRetry={() => {
                            setRetries((value) => value + 1)
                        }}
                    >
                        The radio went quiet.
                    </ErrorState>
                </Stack>
            </Group>
            <Group label='Sample data banner'>
                <SampleDataBanner />
            </Group>
            <Group label='Cost comparison'>
                <CostComparison />
            </Group>
        </Specimen>
    )
}

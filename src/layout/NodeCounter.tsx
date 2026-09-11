import { countByStatus, SOURCE } from '@/data/network'
import { plural } from '@/lib/format'
import { Row, StatusDot, Text } from '@/ui'

/**
 * The cheapest possible proof the network is real — and the offline count sits
 * right next to the online one so it cannot be quietly hidden.
 */
export function NodeCounter({ tone = 'footer' }: { tone?: 'footer' | 'inline' }) {
    const counts = countByStatus()
    const down = counts.offline + counts.degraded

    return (
        <Row gap={3} wrap>
            <Row gap={2} wrap={false}>
                <StatusDot kind='live' pulse />
                <Text
                    as='span'
                    size='xs'
                    mono
                    tone={tone === 'footer' ? 'muted' : 'default'}
                    weight={500}
                >
                    {counts.online} {plural(counts.online, 'node')} online
                </Text>
            </Row>
            <Row gap={2} wrap={false}>
                <StatusDot kind={down > 0 ? 'dead' : 'neutral'} />
                <Text as='span' size='xs' mono tone={down > 0 ? 'dead' : 'faint'} weight={500}>
                    {down} down
                </Text>
            </Row>
            {SOURCE.kind === 'sample' ? (
                <Text as='span' size='xs' mono tone='warn' weight={500}>
                    sample data
                </Text>
            ) : null}
        </Row>
    )
}

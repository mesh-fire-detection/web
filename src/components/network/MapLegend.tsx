import { Row, Stack, StatusDot, Text } from '@/ui'

const STATUSES = [
  { kind: 'live' as const, label: 'Online' },
  { kind: 'warn' as const, label: 'Degraded' },
  { kind: 'dead' as const, label: 'Offline' },
]

export function MapLegend() {
  return (
    <Stack gap={2} className="map-legend">
      <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
        Node status
      </Text>
      {STATUSES.map((status) => (
        <Row key={status.label} gap={2} wrap={false}>
          <StatusDot kind={status.kind} />
          <Text as="span" size="2xs" mono tone="muted">
            {status.label}
          </Text>
        </Row>
      ))}
      <Text as="div" size="2xs" mono tone="faint">
        Dashed link = marginal or dead
      </Text>
    </Stack>
  )
}

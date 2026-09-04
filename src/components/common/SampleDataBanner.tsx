import { Badge, Box, Row, Stack, Text } from '@/ui'
import { SOURCE } from '@/data/network'

/**
 * Shown wherever network numbers appear, for as long as they are seed data.
 * When SOURCE.kind flips to 'live' this disappears everywhere at once.
 */
export function SampleDataBanner() {
  if (SOURCE.kind === 'live') return null

  return (
    <Box tone="warn" accent="warn" border={false} padding={4} radius="sm">
      <Row gap={4} align="start" wrap>
        <Badge kind="warn">Sample data</Badge>
        <Stack gap={1} minWidth0 grow>
          <Text size="sm" weight={600}>
            {SOURCE.label}
          </Text>
          <Text size="sm" tone="muted" measure={92}>
            {SOURCE.detail}
          </Text>
        </Stack>
      </Row>
    </Box>
  )
}

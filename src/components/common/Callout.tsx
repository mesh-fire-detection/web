import type { ReactNode } from 'react'
import { Box, Heading, Icon, Row, Stack, Text } from '@/ui'
import type { IconName } from '@/ui'

export function Callout({
  title,
  children,
  tone = 'warn',
  icon = 'alert',
}: {
  title: string
  children: ReactNode
  tone?: 'fire' | 'warn' | 'live' | 'dead' | undefined
  icon?: IconName | undefined
}) {
  return (
    <Box tone={tone} accent={tone} border={false} padding={5} radius="sm">
      <Row gap={3} align="start" wrap={false}>
        <Text as="span" tone={tone} className="callout__icon">
          <Icon name={icon} size={18} />
        </Text>
        <Stack gap={2} minWidth0>
          <Heading level={3} size="sm" tone={tone}>
            {title}
          </Heading>
          <Text size="sm" tone="muted" measure={80}>
            {children}
          </Text>
        </Stack>
      </Row>
    </Box>
  )
}

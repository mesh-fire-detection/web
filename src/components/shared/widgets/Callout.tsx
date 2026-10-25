import type { ReactNode } from 'react'

import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Icon } from '@components/shared/widgets/Icon'
import type { IconName } from '@components/shared/widgets/Icon'

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
        <Box tone={tone} accent={tone} border={false} padding={5} radius='sm'>
            <Row gap={3} align='start' wrap={false}>
                <Text as='span' tone={tone}>
                    <Icon name={icon} size={18} />
                </Text>
                <Stack gap={2} minWidth0>
                    <Heading level={3} size='sm' tone={tone}>
                        {title}
                    </Heading>
                    <Text size='sm' tone='muted' measure={80}>
                        {children}
                    </Text>
                </Stack>
            </Row>
        </Box>
    )
}

export function EmptyState({
    title,
    children,
    action,
}: {
    title: string
    children: ReactNode
    action?: ReactNode | undefined
}) {
    return (
        <Box className='empty_state' padding={5} radius='sm' tone='surface-2'>
            <Stack align='center' gap={3}>
                <Heading level={3} size='sm' align='center'>
                    {title}
                </Heading>
                <Text align='center' measure={64} size='sm' tone='muted'>
                    {children}
                </Text>
                {action}
            </Stack>
        </Box>
    )
}

export function ErrorState({
    title,
    children,
    onRetry,
    retryLabel = 'Try again',
}: {
    title: string
    children: ReactNode
    onRetry?: (() => void) | undefined
    retryLabel?: string | undefined
}) {
    return (
        <div className='error_state' role='alert'>
            <Box padding={5} radius='sm' tone='dead' accent='dead'>
                <Stack gap={3}>
                    <Heading level={3} size='sm' tone='dead'>
                        {title}
                    </Heading>
                    <Text size='sm' tone='muted'>
                        {children}
                    </Text>
                    {onRetry ? (
                        <Row>
                            <Button onClick={onRetry} variant='secondary'>
                                {retryLabel}
                            </Button>
                        </Row>
                    ) : null}
                </Stack>
            </Box>
        </div>
    )
}

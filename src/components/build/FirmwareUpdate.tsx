import { StepItem, StepList } from '@components/shared/page/StepList'
import { Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import type { Tone } from '@components/shared/typography/Text'
import { ButtonLink } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { firmwareContent } from '@core/content/build/firmware'
import { firmwareUpdate } from '@core/nearby/firmware'
import type { FirmwareUpdate as UpdateStatus } from '@core/nearby/firmware'

const STATUS_TONE: Readonly<Record<UpdateStatus, Tone>> = {
    current: 'live',
    outdated: 'warn',
    other: 'warn',
    unknown: 'faint',
}

/** A short update guide beside the node's reported build. */
export function FirmwareUpdate({ firmware }: { readonly firmware: string }) {
    const copy = firmwareContent.update
    const status = firmwareUpdate(firmware)
    return (
        <Stack gap={5}>
            <Stack gap={3}>
                <Row gap={3} justify='between'>
                    <Heading level={3} size='sm'>
                        {copy.title}
                    </Heading>
                    {status === 'current' ? (
                        <Badge kind='live' mono={false}>
                            {copy.status.current}
                        </Badge>
                    ) : null}
                </Row>
                {status === 'current' ? null : (
                    <Text size='sm' tone={STATUS_TONE[status]}>
                        {copy.status[status]}
                    </Text>
                )}
            </Stack>
            <StepList>
                {copy.steps.map((step, index) => (
                    <StepItem key={step} index={index + 1}>
                        <Text size='sm' tone='muted' measure={82}>
                            {step}
                        </Text>
                    </StepItem>
                ))}
            </StepList>
            <Stack gap={3}>
                <ButtonLink to='/firmware' variant='primary'>
                    {copy.cta}
                </ButtonLink>
                <Text size='xs' tone='faint'>
                    {copy.keepNote}
                </Text>
            </Stack>
        </Stack>
    )
}

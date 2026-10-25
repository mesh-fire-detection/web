import { StepItem, StepList } from '@components/shared/page/StepList'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { ASSEMBLY } from '@core/content/build/bom'

export function AssemblySteps() {
    const total = ASSEMBLY.reduce((sum, step) => sum + step.minutes, 0)

    return (
        <Stack gap={4}>
            <StepList>
                {ASSEMBLY.map((step, index) => (
                    <StepItem key={step.title} index={index + 1}>
                        <Stack gap={2}>
                            <Row justify='between' gap={3}>
                                <Heading level={3} size='sm'>
                                    {step.title}
                                </Heading>
                                <Text as='span' size='2xs' mono tone='faint'>
                                    {step.minutes === 0 ? 'unattended' : `${step.minutes} min`}
                                </Text>
                            </Row>
                            <Text size='sm' tone='muted' measure={82}>
                                {step.detail}
                            </Text>
                        </Stack>
                    </StepItem>
                ))}
            </StepList>

            <Box tone='surface-2' padding={4} radius='sm'>
                <Text size='sm' tone='muted'>
                    About {total} minutes of hands-on work, plus print time and a 48-hour soak test.
                    If you had to ask a question to get here, that is a bug — open an issue.
                </Text>
            </Box>
        </Stack>
    )
}

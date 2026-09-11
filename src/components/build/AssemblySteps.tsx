import { ASSEMBLY } from '@/data/bom'
import { Box, Heading, Row, Stack, Text } from '@/ui'

export function AssemblySteps() {
    const total = ASSEMBLY.reduce((sum, step) => sum + step.minutes, 0)

    return (
        <Stack gap={4}>
            <Stack gap={0} className='steps'>
                {ASSEMBLY.map((step, index) => (
                    <Row key={step.title} gap={4} align='start' wrap={false} className='steps_row'>
                        <Text
                            as='div'
                            size='xs'
                            mono
                            weight={600}
                            tone='fire'
                            className='steps_num'
                        >
                            {String(index + 1).padStart(2, '0')}
                        </Text>
                        <Stack gap={2} minWidth0>
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
                    </Row>
                ))}
            </Stack>

            <Box tone='surface-2' padding={4} radius='sm'>
                <Text size='sm' tone='muted'>
                    About {total} minutes of hands-on work, plus print time and a 48-hour soak test.
                    If you had to ask a question to get here, that is a bug — open an issue.
                </Text>
            </Box>
        </Stack>
    )
}

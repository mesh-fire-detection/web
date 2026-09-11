import { List, ListItem } from '@components/shared/page/List'
import { Box, Divider, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Badge, Metric } from '@components/shared/widgets/Badge'
import { FALSE_POSITIVE_STATE } from '@core/content/problems/falsePositives'

export function FalsePositivePanel() {
    return (
        <Box tone='surface-2' padding={6} radius='md' id='false-positives'>
            <Stack gap={6}>
                <Row justify='between' align='start' gap={4}>
                    <Stack gap={2} minWidth0>
                        <Heading level={2} size='xl' measure={36}>
                            False positives
                        </Heading>
                        <Text size='lg' tone='warn' measure={64}>
                            {FALSE_POSITIVE_STATE.headline}
                        </Text>
                    </Stack>
                    <Badge kind='warn'>Not yet measured</Badge>
                </Row>

                <Text size='md' tone='muted' measure={84}>
                    Every cheap fire detection project dies on false positives — dust, fog, morning
                    mist, a neighbour's burn pile. Publishing a measured rate is what gets a fire
                    district to take a meeting. We do not have one yet, so here is the number we
                    will publish and how we will get it.
                </Text>

                <Grid columns={3} minColumnWidth={150} gap={5}>
                    <Metric label='False-positive rate' value='unmeasured' tone='warn' size='md' />
                    <Metric label='False-negative rate' value='unmeasured' tone='warn' size='md' />
                    <Metric
                        label='Vision nodes reporting'
                        value='2'
                        size='md'
                        hint='both in sample data'
                    />
                </Grid>

                <Divider space={0} />

                <Grid columns={2} minColumnWidth={300} gap={6} align='start'>
                    <Stack gap={3}>
                        <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                            Test plan
                        </Text>
                        <List marker='number' gap={3}>
                            {FALSE_POSITIVE_STATE.plan.map((step) => (
                                <ListItem key={step} size='sm'>
                                    {step}
                                </ListItem>
                            ))}
                        </List>
                    </Stack>

                    <Stack gap={4}>
                        <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                            Alerting model
                        </Text>
                        {FALSE_POSITIVE_STATE.alerting.map((item) => (
                            <Stack key={item.question} gap={1}>
                                <Text size='sm' weight={600}>
                                    {item.question}
                                </Text>
                                <Text size='sm' tone='muted' measure={58}>
                                    {item.answer}
                                </Text>
                            </Stack>
                        ))}
                    </Stack>
                </Grid>

                <Box tone='warn' border={false} accent='warn' padding={4} radius='sm'>
                    <Text size='sm' weight={600}>
                        This network is not an emergency service. It does not contact 911, and no
                        alert it produces is a substitute for calling one.
                    </Text>
                </Box>
            </Stack>
        </Box>
    )
}

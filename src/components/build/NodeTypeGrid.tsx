import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Badge } from '@components/shared/widgets/Badge'
import { Icon } from '@components/shared/widgets/Icon'
import { nodeCost } from '@core/content/build/bom'
import { NODE_TYPES, nodesByType } from '@core/content/network/network'
import { money, plural } from '@core/format/format'

export function NodeTypeGrid() {
    return (
        <Grid columns={4} minColumnWidth={230} gap={4}>
            {NODE_TYPES.map((spec) => {
                const deployed = nodesByType(spec.type).length
                return (
                    <Box
                        key={spec.type}
                        tone='surface'
                        padding={5}
                        radius='md'
                        className='ntype'
                        grow
                    >
                        <Stack gap={4} grow>
                            <Row justify='between' gap={3}>
                                <Text as='span' tone='fire' className='ntype_icon'>
                                    <Icon name={spec.icon} size={20} />
                                </Text>
                                <Badge>{money(nodeCost(spec.type))}</Badge>
                            </Row>

                            <Stack gap={1}>
                                <Heading level={3} size='md'>
                                    {spec.name}
                                </Heading>
                                <Text size='xs' mono uppercase tone='fire' weight={600}>
                                    {spec.role}
                                </Text>
                            </Stack>

                            <Text size='sm' tone='muted' className='grow'>
                                {spec.detail}
                            </Text>

                            <Text size='2xs' mono tone='faint' uppercase>
                                {deployed} {plural(deployed, 'node')} deployed
                            </Text>
                        </Stack>
                    </Box>
                )
            })}
        </Grid>
    )
}

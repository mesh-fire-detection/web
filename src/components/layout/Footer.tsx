import { useState } from 'react'

import { NodeCounter } from '@components/layout/NodeCounter'
import { Container, Divider, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import { SITE } from '@core/config/site'
import { footerContent } from '@core/content/site/footer'

export function Footer() {
    const [year] = useState(() => new Date().getFullYear())
    return (
        <Stack as='footer' gap={0} className='footer'>
            <Container>
                <Stack gap={7}>
                    <Grid columns={4} minColumnWidth={180} gap={6}>
                        {footerContent.columns.map((column) => (
                            <Stack key={column.title} gap={3}>
                                <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
                                    {column.title}
                                </Text>
                                <Stack gap={2} align='start'>
                                    {column.links.map((link) => (
                                        <TextLink
                                            key={link.label}
                                            to={link.to}
                                            tone='quiet'
                                            size='sm'
                                        >
                                            {link.label}
                                        </TextLink>
                                    ))}
                                </Stack>
                            </Stack>
                        ))}
                    </Grid>

                    <Divider space={0} />

                    {/* Both non-negotiables live here: the disclaimer and the live count. */}
                    <Row justify='between' gap={4}>
                        <Text as='div' size='sm' weight={600} tone='warn'>
                            {SITE.disclaimer}
                        </Text>
                        <NodeCounter />
                    </Row>

                    <Row justify='between' gap={4} className='footer_bottom'>
                        <Row gap={4} wrap>
                            <Text as='span' size='xs' tone='faint'>
                                Hardware{' '}
                                <TextLink to={SITE.licenses.hardware.href} tone='quiet' size='xs'>
                                    {SITE.licenses.hardware.name}
                                </TextLink>
                            </Text>
                            <Text as='span' size='xs' tone='faint'>
                                Firmware{' '}
                                <TextLink to={SITE.licenses.firmware.href} tone='quiet' size='xs'>
                                    {SITE.licenses.firmware.name}
                                </TextLink>
                            </Text>
                            <TextLink to='/privacy' tone='quiet' size='xs'>
                                Privacy
                            </TextLink>
                            <TextLink to='/terms' tone='quiet' size='xs'>
                                Terms
                            </TextLink>
                        </Row>
                        <Text as='span' size='xs' tone='faint'>
                            © {year} {SITE.name}
                        </Text>
                    </Row>
                </Stack>
            </Container>
        </Stack>
    )
}

import { Page } from '@components/layout/Page'
import { Container, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { ButtonLink } from '@components/shared/widgets/Action'
import { notFoundContent } from '@core/content/site/notFound'

export function NotFoundPage() {
    const copy = notFoundContent
    return (
        <Page title='Not found' headed={false}>
            <Section space='lg' grid>
                <Container width='narrow'>
                    <Stack gap={5} align='center'>
                        <Text size='lg' mono tone='fire' weight={600}>
                            {copy.code}
                        </Text>
                        <Heading level={1} size='2xl' align='center' measure={26}>
                            {copy.title}
                        </Heading>
                        <Text tone='muted' align='center' measure={60}>
                            {copy.lede}
                        </Text>
                        <Row gap={3} justify='center'>
                            <ButtonLink to='/'>{copy.homeCta}</ButtonLink>
                            <ButtonLink to='/build' variant='secondary'>
                                {copy.buildCta}
                            </ButtonLink>
                        </Row>
                    </Stack>
                </Container>
            </Section>
        </Page>
    )
}

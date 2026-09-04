import { ButtonLink, Container, Heading, Row, Section, Stack, Text } from '@/ui'
import { Page } from '@/layout/Page'

export function NotFoundPage() {
  return (
    <Page title="Not found" headed={false}>
      <Section space="lg" grid>
        <Container width="narrow">
          <Stack gap={5} align="center">
            <Text size="lg" mono tone="fire" weight={600}>
              404
            </Text>
            <Heading level={1} size="2xl" align="center" measure={26}>
              No node here.
            </Heading>
            <Text tone="muted" align="center" measure={60}>
              This page does not exist, which at least is a failure we can show you honestly.
            </Text>
            <Row gap={3} justify="center">
              <ButtonLink to="/">Back to the map</ButtonLink>
              <ButtonLink to="/build" variant="secondary">
                Build a node instead
              </ButtonLink>
            </Row>
          </Stack>
        </Container>
      </Section>
    </Page>
  )
}

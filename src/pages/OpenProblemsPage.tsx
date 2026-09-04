import {
  Badge,
  Box,
  ButtonAnchor,
  Grid,
  Heading,
  Icon,
  Row,
  Section,
  Stack,
  Text,
  TextLink,
} from '@/ui'
import { Page } from '@/layout/Page'
import { ProblemCard } from '@/components/problems/ProblemCard'
import { FalsePositivePanel } from '@/components/problems/FalsePositivePanel'
import { PROBLEMS } from '@/data/problems'
import { SITE } from '@/data/site'

const STATUS_KIND = {
  open: 'dead',
  'in-progress': 'warn',
  'has-candidate': 'live',
} as const

export function OpenProblemsPage() {
  return (
    <Page
      title="Open problems"
      eyebrow="Unsolved"
      lede="Five things we have not figured out, each with its constraints, what has been tried, the current best candidate, and what would have to be true to call it closed."
      aside={
        <Row gap={3}>
          <ButtonAnchor
            href={`${SITE.github}/discussions`}
            size="md"
            variant="primary"
            iconAfter={<Icon name="arrow-up-right" size={14} />}
          >
            Claim a problem
          </ButtonAnchor>
          <ButtonAnchor href={SITE.discord} size="md" iconBefore={<Icon name="discord" size={16} />}>
            Discord
          </ButtonAnchor>
        </Row>
      }
    >
      <Section space="sm">
        <Stack gap={5}>
          <Box tone="surface-2" padding={5} radius="md">
            <Stack gap={4}>
              <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
                Contents
              </Text>
              <Grid columns={3} minColumnWidth={220} gap={3}>
                {PROBLEMS.map((problem, index) => (
                  <Row key={problem.slug} gap={3} align="start" wrap={false}>
                    <Text as="span" size="xs" mono tone="fire" weight={600}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <Stack gap={1} minWidth0 align="start">
                      <TextLink to={`#${problem.slug}`} tone="quiet" size="sm">
                        {problem.title}
                      </TextLink>
                      <Badge kind={STATUS_KIND[problem.status]} size="xs">
                        {problem.status.replace('-', ' ')}
                      </Badge>
                    </Stack>
                  </Row>
                ))}
              </Grid>
            </Stack>
          </Box>

          <Text tone="muted" measure={88}>
            This page is unusual and deliberately so. Most hardware projects publish what works and
            stay quiet about what does not, which reads as confidence and produces spectators. The
            list below is the actual state of the project. If one of these is your field, you can
            close it faster than we can.
          </Text>
        </Stack>
      </Section>

      <Section space="sm">
        <Stack gap={5}>
          {PROBLEMS.map((problem) => (
            <ProblemCard key={problem.slug} problem={problem} />
          ))}
        </Stack>
      </Section>

      <Section space="md" tone="raised" bordered>
        <FalsePositivePanel />
      </Section>

      <Section space="md" bordered>
        <Grid columns={2} minColumnWidth={320} gap={7} align="start">
          <Stack gap={4}>
            <Heading level={2} size="xl" measure={30}>
              How a problem gets closed
            </Heading>
            <Text tone="muted" measure={70}>
              Open a discussion on the problem you want. Say what you would try and what you would
              need. When you have a result — including a negative one — it goes on this page under
              "what has been tried", with your name on it.
            </Text>
            <Text tone="muted" measure={70}>
              Negative results are worth as much as positive ones here. Half the entries above are
              things that did not work, and each one saved somebody a month.
            </Text>
          </Stack>

          <Box tone="surface" padding={6} radius="md">
            <Stack gap={4}>
              <Heading level={3} size="sm">
                What we are not building
              </Heading>
              <Text size="sm" tone="muted">
                No forum — discussion happens on GitHub and Discord, where the people who would
                answer already are. No donate button until a node has survived a winter outdoors. No
                detection-time claim until the baseline is measured.
              </Text>
              <Row gap={3}>
                <ButtonAnchor href={SITE.github} size="sm" iconBefore={<Icon name="github" size={14} />}>
                  GitHub
                </ButtonAnchor>
                <ButtonAnchor href={SITE.discord} size="sm" iconBefore={<Icon name="discord" size={14} />}>
                  Discord
                </ButtonAnchor>
              </Row>
            </Stack>
          </Box>
        </Grid>
      </Section>
    </Page>
  )
}

import {
  Badge,
  Box,
  ButtonAnchor,
  Divider,
  Grid,
  Heading,
  Icon,
  List,
  ListItem,
  Row,
  Stack,
  Text,
} from '@/ui'
import type { OpenProblem, ProblemStatus } from '@/data/problems'
import { SITE } from '@/data/site'

const STATUS: Record<ProblemStatus, { label: string; kind: 'dead' | 'warn' | 'live' }> = {
  open: { label: 'Open', kind: 'dead' },
  'in-progress': { label: 'In progress', kind: 'warn' },
  'has-candidate': { label: 'Candidate found', kind: 'live' },
}

export function ProblemCard({ problem }: { problem: OpenProblem }) {
  const status = STATUS[problem.status]

  return (
    <Box tone="surface" padding={6} radius="md" id={problem.slug} as="article">
      <Stack gap={5}>
        <Row justify="between" align="start" gap={4}>
          <Stack gap={2} minWidth0>
            <Heading level={3} size="lg" measure={40}>
              {problem.title}
            </Heading>
            <Text size="md" tone="fire" measure={72}>
              {problem.question}
            </Text>
          </Stack>
          <Badge kind={status.kind}>{status.label}</Badge>
        </Row>

        <Divider space={0} />

        <Grid columns={2} minColumnWidth={280} gap={6}>
          <Stack gap={3}>
            <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
              Constraints
            </Text>
            <List marker="dash" gap={2}>
              {problem.constraints.map((constraint) => (
                <ListItem key={constraint} size="sm">
                  {constraint}
                </ListItem>
              ))}
            </List>
          </Stack>

          <Stack gap={3}>
            <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
              What has been tried
            </Text>
            <Stack gap={3}>
              {problem.tried.map((attempt) => (
                <Stack key={attempt.approach} gap={1}>
                  <Text size="sm" weight={600}>
                    {attempt.approach}
                  </Text>
                  <Text size="sm" tone="muted" measure={60}>
                    {attempt.outcome}
                  </Text>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Grid>

        {problem.candidate ? (
          <Box tone="live" border={false} accent="live" padding={4} radius="sm">
            <Stack gap={2}>
              <Row gap={2}>
                <Badge kind="live" size="xs">
                  Current best candidate
                </Badge>
              </Row>
              <Text size="sm" weight={600}>
                {problem.candidate.name}
              </Text>
              <Text size="sm" tone="muted" measure={82}>
                {problem.candidate.detail}
              </Text>
              <Text size="sm" tone="warn" measure={82}>
                Blocker: {problem.candidate.blocker}
              </Text>
            </Stack>
          </Box>
        ) : null}

        <Grid columns={2} minColumnWidth={280} gap={5} align="start">
          <Stack gap={2}>
            <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
              Closes when
            </Text>
            <Text size="sm" tone="muted" measure={60}>
              {problem.closesWhen}
            </Text>
          </Stack>
          <Stack gap={3} align="start">
            <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
              Who we need
            </Text>
            <Text size="sm" tone="muted" measure={60}>
              {problem.help}
            </Text>
            <ButtonAnchor
              href={`${SITE.github}/discussions`}
              size="sm"
              variant="secondary"
              iconAfter={<Icon name="arrow-up-right" size={14} />}
            >
              Take this on
            </ButtonAnchor>
          </Stack>
        </Grid>
      </Stack>
    </Box>
  )
}

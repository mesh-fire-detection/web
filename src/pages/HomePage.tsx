import { useState } from 'react'
import {
  Box,
  Break,
  ButtonLink,
  Container,
  Eyebrow,
  Grid,
  Heading,
  Icon,
  Metric,
  Row,
  Section,
  Stack,
  Text,
  TextLink,
  Value,
} from '@/ui'
import { Page } from '@/layout/Page'
import { SectionHead } from '@/components/common/SectionHead'
import { CostComparison } from '@/components/common/CostComparison'
import { SampleDataBanner } from '@/components/common/SampleDataBanner'
import { NodeTypeGrid } from '@/components/build/NodeTypeGrid'
import { LazyNetworkMap } from '@/components/network/LazyNetworkMap'
import { MapLegend } from '@/components/network/MapLegend'
import { NodePanel } from '@/components/network/NodePanel'
import { PROBLEMS } from '@/data/problems'
import type { MeshNode } from '@/data/network'
import { countByStatus } from '@/data/network'
import { plural } from '@/lib/format'

export function HomePage() {
  const [selected, setSelected] = useState<MeshNode | null>(null)
  const counts = countByStatus()

  return (
    <Page title="Home" headed={false}>
      {/* ------------------------------------------------------------- hero */}
      <Section space="lg" grid>
        <Stack gap={8}>
          <Stack gap={5} align="center">
            <Eyebrow>Open hardware · LoRa mesh · US915</Eyebrow>
            <Heading level={1} size="5xl" align="center" measure={20}>
              A camera site costs $15,000.
              <Break />
              Our node costs $70.
            </Heading>
            <Text size="lg" tone="muted" align="center" measure={68}>
              Wildfire detection fails because coverage is expensive. Make each unit cheap enough to
              lose and you can cover the ground that matters. Here is the bill of materials, the
              network, and everything we have not solved.
            </Text>
            <Row gap={3} justify="center">
              <ButtonLink to="/build" size="lg" iconAfter={<Icon name="arrow-right" size={16} />}>
                Build a Node
              </ButtonLink>
              <ButtonLink to="/map" size="lg" variant="secondary">
                See the network
              </ButtonLink>
            </Row>
          </Stack>

          <CostComparison />
        </Stack>
      </Section>

      {/* -------------------------------------------------------------- map */}
      <Section space="md" tone="raised" bordered id="network">
        <Stack gap={6}>
          <SectionHead
            eyebrow="The network"
            title="Fourteen nodes, and we show you the dead ones"
            lede="Node type, last heartbeat, battery, and the SNR of every link. When a node dies it stays on the map, coloured red, until someone walks up the hill and fixes it."
            action={
              <ButtonLink to="/map" variant="secondary" size="sm" iconAfter={<Icon name="arrow-right" size={14} />}>
                Full map
              </ButtonLink>
            }
          />

          <SampleDataBanner />

          <Box tone="transparent" border={false} padding={0} className="map-shell">
            <MapLegend />
            <LazyNetworkMap selectedId={selected?.id ?? null} onSelect={setSelected} height={460} />
            {selected ? <NodePanel node={selected} onClose={() => setSelected(null)} /> : null}
          </Box>

          <Grid columns={4} minColumnWidth={160} gap={5}>
            <Metric label="Online" value={counts.online} tone="live" size="lg" />
            <Metric label="Degraded" value={counts.degraded} tone="warn" size="lg" />
            <Metric label="Offline" value={counts.offline} tone="dead" size="lg" />
            <Metric label="Hardware cost" value="$1,204" size="lg" hint="all fourteen nodes" />
          </Grid>
        </Stack>
      </Section>

      {/* ---------------------------------------------------- the baseline */}
      <Section space="md" bordered>
        <Grid columns={2} minColumnWidth={320} gap={7} align="start">
          <Stack gap={4}>
            <Eyebrow tone="warn">The problem, quantified</Eyebrow>
            <Heading level={2} size="2xl" measure={26}>
              We do not have a detection-time baseline yet.
            </Heading>
            <Text tone="muted" measure={70}>
              The project's first goal is to reduce wildfire detection time. Reduce it from what? We
              refuse to put an unbacked number on this page — a specific claim you cannot defend is
              the fastest way to lose the agency people this network needs.
            </Text>
            <Text tone="muted" measure={70}>
              So the honest state is: unmeasured. A public records request for one Washington fire
              district is drafted and not yet filed. When the median comes back, it goes here, with
              the raw records next to it.
            </Text>
            <Row gap={3}>
              <ButtonLink to="/open-problems#detection-baseline" variant="secondary" size="sm">
                Read the open problem
              </ButtonLink>
            </Row>
          </Stack>

          <Box tone="surface" padding={6} radius="md">
            <Stack gap={5}>
              <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
                What we will publish
              </Text>
              <Stack gap={4}>
                <BaselineRow label="District" value="One named Washington district" />
                <BaselineRow label="Quantity" value="Ignition to first dispatched unit" />
                <BaselineRow label="Window" value="Five years of incidents" />
                <BaselineRow label="Method" value="Published alongside the raw records" />
                <BaselineRow label="Current value" value="unmeasured" tone="warn" />
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Section>

      {/* ------------------------------------------------------- node types */}
      <Section space="md" tone="raised" bordered>
        <Stack gap={6}>
          <SectionHead
            eyebrow="Four node types"
            title="One of them carries the mesh. The other three hang off it."
            lede="A branch starts at a Cellular node and runs as a chain of Base nodes. Sensor and Vision nodes attach where they are useful, not where the topology needs them."
          />
          <NodeTypeGrid />
        </Stack>
      </Section>

      {/* ---------------------------------------------------- open problems */}
      <Section space="md" bordered>
        <Stack gap={6}>
          <SectionHead
            eyebrow="Unsolved"
            title="The parts we have not figured out"
            lede="Hiding unknowns gets you spectators. Publishing them gets you collaborators. Each of these has constraints, what has been tried, and what would close it."
            action={
              <ButtonLink to="/open-problems" variant="secondary" size="sm" iconAfter={<Icon name="arrow-right" size={14} />}>
                All {PROBLEMS.length} problems
              </ButtonLink>
            }
          />

          <Grid columns={3} minColumnWidth={260} gap={4}>
            {PROBLEMS.map((problem) => (
              <Box key={problem.slug} tone="surface" padding={5} radius="md" className="problem-teaser" grow>
                <Stack gap={3} grow>
                  <Text as="span" tone="fire" className="problem-teaser__icon">
                    <Icon name="problem" size={18} />
                  </Text>
                  <Heading level={3} size="sm">
                    {problem.title}
                  </Heading>
                  <Text size="sm" tone="muted" className="grow">
                    {problem.question}
                  </Text>
                  <TextLink to={`/open-problems#${problem.slug}`} tone="fire" size="xs">
                    {problem.tried.length} {plural(problem.tried.length, 'approach', 'approaches')} tried
                  </TextLink>
                </Stack>
              </Box>
            ))}
          </Grid>
        </Stack>
      </Section>

      {/* --------------------------------------------------------- closing */}
      <Section space="md" tone="sunken" bordered>
        <Container width="narrow">
          <Stack gap={5} align="center">
            <Heading level={2} size="2xl" align="center" measure={28}>
              Ten minutes from this page to a filled cart.
            </Heading>
            <Text tone="muted" align="center" measure={66}>
              Every part is linked to a supplier with a current price. The enclosure STLs and the
              Meshtastic config presets are hosted here, not behind a form. If you have to ask a
              question to build a node, that is a bug in this site.
            </Text>
            <Row gap={3} justify="center">
              <ButtonLink to="/build" size="lg" iconAfter={<Icon name="arrow-right" size={16} />}>
                Bill of materials
              </ButtonLink>
              <ButtonLink to="/coverage" size="lg" variant="secondary">
                Would it work where I live?
              </ButtonLink>
            </Row>
          </Stack>
        </Container>
      </Section>
    </Page>
  )
}

function BaselineRow({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'warn' | undefined
}) {
  return (
    <Row justify="between" gap={4} align="start" className="baseline-row">
      <Text as="span" size="xs" mono uppercase tone="faint" weight={600}>
        {label}
      </Text>
      <Value tone={tone} size="sm">
        {value}
      </Value>
    </Row>
  )
}

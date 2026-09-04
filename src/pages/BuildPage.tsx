import {
  Box,
  ButtonAnchor,
  ButtonLink,
  DescriptionItem,
  DescriptionList,
  Grid,
  Heading,
  Icon,
  List,
  ListItem,
  Metric,
  Row,
  Section,
  Stack,
  Text,
} from '@/ui'
import { Page } from '@/layout/Page'
import { SectionHead } from '@/components/common/SectionHead'
import { NodeTypeGrid } from '@/components/build/NodeTypeGrid'
import { BomTable } from '@/components/build/BomTable'
import { DownloadList } from '@/components/build/DownloadList'
import { AssemblySteps } from '@/components/build/AssemblySteps'
import { Callout } from '@/components/common/Callout'
import { SITE } from '@/data/site'
import { PRESETS } from '@/lib/linkBudget'

const PLACEMENT = [
  {
    title: 'Get the antenna high, then get it vertical',
    detail:
      'Height buys more link budget than any component on the bill of materials. A Base node at 8 m outperforms the same node at 2 m by roughly 6 dB of horizon alone, and costs a pipe.',
  },
  {
    title: 'Ridge to ridge, not ridge to valley',
    detail:
      'The chain wants line of sight along the terrain, not across it. A hop that crosses a drainage at right angles is a hop that fails in the first wet winter.',
  },
  {
    title: 'Point Vision nodes across a drainage',
    detail:
      'A camera viewshed is a propagation viewshed with different constants. Site them where they see the valley floor, not where they see the next ridge.',
  },
  {
    title: 'Never make one node critical',
    detail:
      'If a node has exactly one parent, its failure orphans everything behind it. The map shows exactly this — Mailbox Bowl is unreachable because Mailbox Spur is down.',
  },
]

export function BuildPage() {
  return (
    <Page
      title="Build a node"
      eyebrow="Bill of materials · STLs · firmware"
      lede="Every part, every price, every file. Nothing behind a form, nothing that needs an email. If you have to ask us a question to finish a node, this page has a bug in it."
      aside={
        <Row gap={3}>
          <ButtonLink to="#bom" size="md" iconAfter={<Icon name="arrow-right" size={14} />}>
            Jump to the parts list
          </ButtonLink>
          <ButtonAnchor
            href={SITE.github}
            size="md"
            iconBefore={<Icon name="github" size={16} />}
          >
            Source
          </ButtonAnchor>
        </Row>
      }
    >
      <Section space="md" id="node-types">
        <Stack gap={6}>
          <SectionHead
            eyebrow="Node types"
            title="Pick what you are building"
            lede="Every node type is a Base node with something added. Build a Base first — it is the cheapest way to find out whether your site works at all."
          />
          <NodeTypeGrid />
        </Stack>
      </Section>

      <Section space="md" tone="raised" bordered id="bom">
        <Stack gap={6}>
          <SectionHead
            eyebrow="Bill of materials"
            title="Part, supplier, price, running total"
            lede="Prices are what the supplier listed on the date shown, in USD, before shipping and tax. Where a part is not settled, the table says estimated rather than pretending otherwise."
          />
          <BomTable />

          <Callout title="One substitution will cost you a node" tone="warn">
            Print the shell in ASA, not PLA. A PLA enclosure in direct sun softens and warps by its
            second summer, and every seal on it fails at once. It is the single most common way a
            build of this kind dies quietly a year after you install it.
          </Callout>
        </Stack>
      </Section>

      <Section space="md" bordered id="enclosures">
        <Stack gap={6}>
          <SectionHead
            eyebrow="Enclosures"
            title="STLs, hosted here"
            lede="Printed in ASA at 0.2 mm, four walls, 30% infill. No supports on any part. Print times assume a 0.4 mm nozzle."
          />
          <DownloadList kind="stl" />
          <Text size="sm" tone="warn" measure={86}>
            The enclosure geometry is not published yet. Rather than serve you a file that is not
            there, these link to the hardware repository — the print settings below are current, the
            meshes are not.
          </Text>

          <Grid columns={2} minColumnWidth={300} gap={6}>
            <Box tone="surface" padding={5} radius="md">
              <Stack gap={4}>
                <Heading level={3} size="sm">
                  Print settings
                </Heading>
                <DescriptionList columns={1}>
                  <DescriptionItem term="Material">ASA. ABS works; PLA does not.</DescriptionItem>
                  <DescriptionItem term="Layer height">0.2 mm</DescriptionItem>
                  <DescriptionItem term="Walls">4 perimeters, 30% gyroid infill</DescriptionItem>
                  <DescriptionItem term="Supports">None required in the shipped orientation</DescriptionItem>
                  <DescriptionItem term="Post-processing">Silicone the cable pass-through; nothing else</DescriptionItem>
                </DescriptionList>
              </Stack>
            </Box>

            <Box tone="surface" padding={5} radius="md">
              <Stack gap={4}>
                <Heading level={3} size="sm">
                  What IP65 means here
                </Heading>
                <Text size="sm" tone="muted">
                  Dust-tight and rated against low-pressure water jets from any direction. It is a
                  design target for these parts, not a certification — nobody has taken one of these
                  shells to a test house.
                </Text>
                <Text size="sm" tone="warn">
                  Soak-test every node outdoors for 48 hours before you carry it somewhere remote.
                </Text>
              </Stack>
            </Box>
          </Grid>
        </Stack>
      </Section>

      <Section space="md" tone="raised" bordered id="firmware">
        <Stack gap={6}>
          <SectionHead
            eyebrow="Firmware & config"
            title="Meshtastic presets as downloadable JSON"
            lede="Flash from the Meshtastic web installer, then import the preset for your node type. No toolchain, no build step, no drivers on macOS or Linux."
          />
          <DownloadList kind="json" />

          <Box tone="surface" padding={5} radius="md">
            <Stack gap={4}>
              <Heading level={3} size="sm">
                Radio presets, and what each one costs you
              </Heading>
              <Grid columns={4} minColumnWidth={180} gap={5}>
                {PRESETS.map((preset) => (
                  <Stack key={preset.id} gap={2}>
                    <Metric label={preset.label} value={`${preset.sensitivityDbm} dBm`} size="sm" hint="sensitivity" />
                    <Text size="2xs" mono tone="faint">
                      SF{preset.spreadingFactor} · {preset.bandwidthKHz} kHz · {preset.airtimeMs} ms airtime
                    </Text>
                  </Stack>
                ))}
              </Grid>
              <Text size="sm" tone="muted">
                The network runs Long / Fast. Slower presets buy range and spend airtime — and
                airtime is the thing that caps how many nodes a branch can carry.
              </Text>
            </Stack>
          </Box>
        </Stack>
      </Section>

      <Section space="md" bordered id="assembly">
        <Grid columns={2} minColumnWidth={320} gap={7} align="start">
          <Stack gap={5}>
            <SectionHead eyebrow="Assembly" title="Six steps, about an hour" size="lg" />
            <AssemblySteps />
          </Stack>

          <Stack gap={5}>
            <SectionHead
              eyebrow="Placement"
              title="Where the node goes matters more than what is in it"
              size="lg"
            />
            <Stack gap={4}>
              {PLACEMENT.map((item) => (
                <Box key={item.title} tone="surface" padding={5} radius="sm">
                  <Stack gap={2}>
                    <Heading level={3} size="sm">
                      {item.title}
                    </Heading>
                    <Text size="sm" tone="muted">
                      {item.detail}
                    </Text>
                  </Stack>
                </Box>
              ))}
            </Stack>
            <ButtonLink to="/coverage" variant="secondary" iconAfter={<Icon name="arrow-right" size={14} />}>
              Check your site in the coverage calculator
            </ButtonLink>
          </Stack>
        </Grid>
      </Section>

      <Section space="md" tone="sunken" bordered>
        <Stack gap={5}>
          <SectionHead
            eyebrow="Before you deploy"
            title="Three things that are not our problem to answer for you"
          />
          <List marker="number" gap={4}>
            <ListItem>
              <Text as="span" weight={600}>
                Permission.
              </Text>{' '}
              Get it in writing from whoever owns the ground. A node on someone else's ridge is
              their node, legally and practically.
            </ListItem>
            <ListItem>
              <Text as="span" weight={600}>
                Radio rules.
              </Text>{' '}
              US915 under FCC Part 15 caps radiated power. The presets ship compliant; if you change
              power or antenna gain, that is on you.
            </ListItem>
            <ListItem>
              <Text as="span" weight={600}>
                Wilderness.
              </Text>{' '}
              Designated wilderness has rules about installed equipment that predate all of this.
              Read them before you carry hardware in.
            </ListItem>
          </List>
        </Stack>
      </Section>
    </Page>
  )
}

import { Page } from '@components/layout/Page'
import { CoverageCalculator } from '@components/pages/coverage/CoverageCalculator'
import { DescriptionItem, DescriptionList, List, ListItem } from '@components/shared/page/List'
import { SectionHead } from '@components/shared/page/SectionHead'
import { Box, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import { Callout } from '@components/shared/widgets/Callout'
import { coverageContent } from '@core/content/coverage'

export function CoveragePage() {
    const copy = coverageContent
    return (
        <Page title={copy.title} eyebrow={copy.eyebrow} lede={copy.lede}>
            <Section space='sm'>
                <CoverageCalculator />
            </Section>

            <Section space='md' tone='raised' bordered>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={copy.scope.eyebrow}
                        title={copy.scope.title}
                        lede={copy.scope.lede}
                    />

                    <Grid columns={2} minColumnWidth={320} gap={6} align='start'>
                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    {copy.scope.modelsTitle}
                                </Heading>
                                <List marker='dash' gap={2}>
                                    {copy.scope.models.map((item) => (
                                        <ListItem key={item} size='sm'>
                                            {item}
                                        </ListItem>
                                    ))}
                                </List>
                            </Stack>
                        </Box>

                        <Box tone='surface' padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={3} size='sm'>
                                    {copy.scope.omitsTitle}
                                </Heading>
                                <List marker='dash' gap={2}>
                                    {copy.scope.omits.map((item) => (
                                        <ListItem key={item} size='sm'>
                                            {item}
                                        </ListItem>
                                    ))}
                                </List>
                            </Stack>
                        </Box>
                    </Grid>

                    <Callout title={copy.scope.calloutTitle} tone='warn'>
                        {copy.scope.calloutBody}
                    </Callout>
                </Stack>
            </Section>

            <Section space='md' bordered>
                <Stack gap={6}>
                    <SectionHead
                        eyebrow={copy.priorArt.eyebrow}
                        title={copy.priorArt.title}
                        lede={copy.priorArt.lede}
                    />

                    <Grid columns={3} minColumnWidth={260} gap={4}>
                        {copy.priorArt.tools.map((tool) => (
                            <Box key={tool.name} tone='surface' padding={5} radius='md' grow>
                                <Stack gap={3} grow>
                                    <Heading level={3} size='sm'>
                                        {tool.name}
                                    </Heading>
                                    <Text size='sm' tone='muted' className='grow'>
                                        {tool.detail}
                                    </Text>
                                    <TextLink to={tool.href} tone='fire' size='xs'>
                                        {copy.priorArt.openLabel}
                                    </TextLink>
                                </Stack>
                            </Box>
                        ))}
                    </Grid>
                </Stack>
            </Section>

            <Section space='md' tone='sunken' bordered>
                <Grid columns={2} minColumnWidth={320} gap={7} align='start'>
                    <Stack gap={4}>
                        <SectionHead
                            eyebrow={copy.maths.eyebrow}
                            title={copy.maths.title}
                            size='lg'
                        />
                        <Text tone='muted' measure={70}>
                            {copy.maths.lede}
                        </Text>
                    </Stack>

                    <DescriptionList columns={1}>
                        {copy.maths.equations.map((item) => (
                            <DescriptionItem key={item.term} term={item.term}>
                                {item.value}
                            </DescriptionItem>
                        ))}
                    </DescriptionList>
                </Grid>
            </Section>

            <Section space='sm'>
                <Row justify='center'>
                    <Text size='sm' tone='faint' align='center' measure={80}>
                        {copy.maths.footnote}
                    </Text>
                </Row>
            </Section>
        </Page>
    )
}

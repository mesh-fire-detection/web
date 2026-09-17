import { Page } from '@components/layout/Page'
import { List, ListItem } from '@components/shared/page/List'
import { Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Callout } from '@components/shared/widgets/Callout'
import { privacyContent, termsContent } from '@core/content/site/legal'
import type { LegalContent } from '@core/content/types'

function LegalDocument({ copy }: { copy: LegalContent }) {
    return (
        <Page
            title={copy.title}
            eyebrow={copy.eyebrow}
            lede={copy.lede}
            aside={
                <Text size='xs' mono tone='faint'>
                    Last updated {copy.updatedOn}
                </Text>
            }
        >
            <Section space='md' width='narrow'>
                <Stack gap={7}>
                    <Callout title={copy.summary.title}>{copy.summary.body}</Callout>

                    {copy.sections.map((section) => (
                        <Stack key={section.id} as='section' id={section.id} gap={3}>
                            <Heading level={2} size='lg'>
                                {section.title}
                            </Heading>
                            {section.paragraphs?.map((paragraph) => (
                                <Text key={paragraph} tone='muted' measure={72}>
                                    {paragraph}
                                </Text>
                            ))}
                            {section.items ? (
                                <List marker='dash' gap={2}>
                                    {section.items.map((item) => (
                                        <ListItem key={item}>{item}</ListItem>
                                    ))}
                                </List>
                            ) : null}
                        </Stack>
                    ))}
                </Stack>
            </Section>
        </Page>
    )
}

export function PrivacyPage() {
    return <LegalDocument copy={privacyContent} />
}

export function TermsPage() {
    return <LegalDocument copy={termsContent} />
}

import { Page } from '@components/layout/Page'
import { Actions, Chrome } from '@components/pages/site/design/Actions'
import { Data, Icons } from '@components/pages/site/design/Data'
import { Feedback } from '@components/pages/site/design/Feedback'
import { Fields } from '@components/pages/site/design/Fields'
import { Foundations, Surfaces, Typography } from '@components/pages/site/design/Foundations'
import { Section, Stack } from '@components/shared/primitives/Layout'

/** Every shared component, in every variant and state it takes. */
export function DesignPage() {
    return (
        <Page
            title='UI Kit'
            eyebrow='Design system'
            lede='Live examples of the design tokens and every shared component, in each of its variants and states.'
        >
            <Section space='sm' bordered>
                <Stack gap={9}>
                    <Foundations />
                    <Typography />
                    <Surfaces />
                    <Actions />
                    <Fields />
                    <Feedback />
                    <Data />
                    <Icons />
                    <Chrome />
                </Stack>
            </Section>
        </Page>
    )
}

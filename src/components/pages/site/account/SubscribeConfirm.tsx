import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { formErrorMessage } from '@components/account/flow'
import { Page } from '@components/layout/Page'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { confirmSubscription } from '@core/api/people'
import { updatesContent } from '@core/content/site/account/updates'

const copy = updatesContent.confirm

/**
 * Where the confirmation email's link lands. It confirms on the button, never
 * on load: mail scanners open links before people do, and one that confirmed
 * on arrival would sign up whoever an address was typed for.
 */
export function SubscribeConfirmPage() {
    const [params] = useSearchParams()
    const token = params.get('token')
    const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
    const [error, setError] = useState<string | undefined>()

    const confirm = async (value: string) => {
        setError(undefined)
        setState('busy')
        const result = await confirmSubscription(value)
        if (result.ok) {
            setState('done')
            return
        }
        setState('idle')
        setError(result.error === 'bad_request' ? copy.invalid : formErrorMessage(result.error))
    }

    return (
        <Page title={copy.title}>
            <Section width='narrow'>
                <Stack gap={4}>
                    {token === null ? (
                        <Text tone='muted'>{copy.missing}</Text>
                    ) : state === 'done' ? (
                        <Text role='status' tone='live'>
                            {copy.done}
                        </Text>
                    ) : (
                        <>
                            <Text tone='muted'>{copy.lede}</Text>
                            <Row>
                                <Button
                                    loading={state === 'busy'}
                                    onClick={() => void confirm(token)}
                                >
                                    {copy.button}
                                </Button>
                            </Row>
                        </>
                    )}
                    {error === undefined ? null : (
                        <Text role='alert' size='sm' tone='dead'>
                            {error}
                        </Text>
                    )}
                </Stack>
            </Section>
        </Page>
    )
}

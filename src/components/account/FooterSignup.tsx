import { useState } from 'react'

import { useConnectedNodes } from '@components/account/connectedNodes'
import { formErrorMessage, looksLikeEmail } from '@components/account/flow'
import { useSession } from '@components/app/SessionProvider'
import { TextField } from '@components/shared/forms/Field'
import { Form } from '@components/shared/forms/Form'
import { Divider, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button, ButtonLink } from '@components/shared/widgets/Action'
import { subscribe } from '@core/api/people'
import { codeStepContent } from '@core/content/site/account/codeStep'
import { membershipContent } from '@core/content/site/account/membership'
import { updatesContent } from '@core/content/site/account/updates'

const copy = updatesContent.footer

const Title = ({ children }: { readonly children: string }) => (
    <Text as='div' size='2xs' mono uppercase weight={600} tone='faint'>
        {children}
    </Text>
)

function SubscribeForm() {
    const [email, setEmail] = useState('')
    const [busy, setBusy] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | undefined>()

    return sent ? (
        <Text role='status' size='sm' tone='live'>
            {copy.sent}
        </Text>
    ) : (
        <Form
            ariaLabel={copy.title}
            busy={busy}
            className='footer_subscribe'
            onSubmit={(event) => {
                event.preventDefault()
                setError(undefined)
                if (!looksLikeEmail(email)) {
                    setError(codeStepContent.invalidEmail)
                    return
                }
                setBusy(true)
                void subscribe(email.trim()).then((result) => {
                    setBusy(false)
                    // The same answer for every address; "sent" is all the page can say.
                    if (result.ok) setSent(true)
                    else setError(formErrorMessage(result.error))
                })
            }}
        >
            <Stack gap={3}>
                {/* The button sits in the input's row, whatever shows under it. */}
                <div className='footer_subscribe_row'>
                    <div className='footer_subscribe_field'>
                        <TextField
                            autoComplete='email'
                            error={error}
                            inputMode='email'
                            label={copy.label}
                            name='email'
                            onChange={setEmail}
                            required
                            type='email'
                            value={email}
                        />
                    </div>
                    <Button loading={busy} type='submit' variant='secondary'>
                        {copy.submit}
                    </Button>
                </div>
                <Text size='xs' tone='faint'>
                    {copy.consent}
                </Text>
            </Stack>
        </Form>
    )
}

/**
 * The footer's one ask, which adapts to who is reading. A signed-in member is
 * asked for nothing. A browser that has connected a node is invited to become
 * a member, since joining includes updates. Everyone else can get updates.
 */
export function FooterSignup() {
    const { session } = useSession()
    const nodes = useConnectedNodes()
    // The divider comes with the signup, so a signed-in footer has no stray rule.
    return session.status === 'signed_out' ? (
        <>
            <Divider space={0} />
            {nodes.length > 0 ? <BecomeMember /> : <GetUpdates />}
        </>
    ) : null
}

const BecomeMember = () => (
    <Stack gap={3}>
        <Title>{membershipContent.footer.title}</Title>
        <Text size='sm' tone='muted' measure={60}>
            {membershipContent.footer.body}
        </Text>
        <Row>
            <ButtonLink size='sm' to='/join'>
                {membershipContent.footer.cta}
            </ButtonLink>
        </Row>
    </Stack>
)

const GetUpdates = () => (
    <Stack gap={3}>
        <Title>{copy.title}</Title>
        <SubscribeForm />
    </Stack>
)

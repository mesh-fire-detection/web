import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { CodeStep } from '@components/account/CodeStep'
import { formErrorMessage, looksLikeEmail, safeNext } from '@components/account/flow'
import { useSession } from '@components/app/SessionProvider'
import { Page } from '@components/layout/Page'
import { TextField } from '@components/shared/forms/Field'
import { Form, FormActions } from '@components/shared/forms/Form'
import { Box, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button, ButtonAnchor, ButtonLink, TextLink } from '@components/shared/widgets/Action'
import { joinWithCode, requestJoin } from '@core/api/auth'
import { SITE } from '@core/config/site'
import { codeStepContent } from '@core/content/site/account/codeStep'
import { joinContent } from '@core/content/site/account/join'

const copy = joinContent

/**
 * Two ways in (backend#9): an invited address, or a node the person built.
 * Only the first is open yet; joining with a node arrives with device
 * registration, so that card points to `/connect` and to asking for an invite.
 */
export function JoinPage() {
    const { session, signedIn } = useSession()
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const next = safeNext(params.get('next'))

    const [step, setStep] = useState<'details' | 'code'>('details')
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [busy, setBusy] = useState(false)
    const [emailError, setEmailError] = useState<string | undefined>()
    const [nameError, setNameError] = useState<string | undefined>()
    const [formError, setFormError] = useState<string | undefined>()

    if (session.status === 'signed_in') return <Navigate replace to={next} />

    const address = email.trim()

    const submitDetails = async () => {
        setEmailError(undefined)
        setNameError(undefined)
        setFormError(undefined)
        const emailOk = looksLikeEmail(address)
        const nameOk = name.trim() !== ''
        if (!emailOk) setEmailError(codeStepContent.invalidEmail)
        if (!nameOk) setNameError(copy.invited.nameInvalid)
        if (!emailOk || !nameOk) return

        setBusy(true)
        const result = await requestJoin(address, name.trim())
        setBusy(false)
        // Every address advances, invited or not: the API answers them alike.
        if (result.ok) setStep('code')
        else setFormError(formErrorMessage(result.error))
    }

    return (
        <Page title={copy.title} lede={copy.lede}>
            <Section>
                <Grid columns={2} minColumnWidth={320} gap={6} align='start'>
                    <Box padding={5} radius='md'>
                        <Stack gap={4}>
                            <Heading level={2} size='md'>
                                {copy.invited.title}
                            </Heading>
                            {step === 'details' ? (
                                <Form
                                    ariaLabel={copy.invited.title}
                                    busy={busy}
                                    onSubmit={(event) => {
                                        event.preventDefault()
                                        void submitDetails()
                                    }}
                                >
                                    <Stack gap={4}>
                                        <Text tone='muted'>{copy.invited.body}</Text>
                                        <TextField
                                            autoComplete='email'
                                            error={emailError}
                                            inputMode='email'
                                            label={copy.invited.emailLabel}
                                            name='email'
                                            onChange={setEmail}
                                            required
                                            type='email'
                                            value={email}
                                        />
                                        <TextField
                                            autoComplete='name'
                                            error={nameError}
                                            label={copy.invited.nameLabel}
                                            name='name'
                                            onChange={setName}
                                            required
                                            value={name}
                                        />
                                        <Text size='sm' tone='muted'>
                                            {copy.invited.updates}
                                        </Text>
                                        <FormActions>
                                            <Button loading={busy} type='submit'>
                                                {copy.invited.submit}
                                            </Button>
                                        </FormActions>
                                        {formError === undefined ? null : (
                                            <Text role='alert' size='sm' tone='dead'>
                                                {formError}
                                            </Text>
                                        )}
                                    </Stack>
                                </Form>
                            ) : (
                                <CodeStep
                                    ariaLabel={copy.invited.title}
                                    email={address}
                                    lede={copy.code.lede}
                                    noEmail={copy.code.noEmail}
                                    onChangeEmail={() => {
                                        setStep('details')
                                    }}
                                    onVerified={(user) => {
                                        signedIn(user)
                                        void navigate(next, { replace: true })
                                    }}
                                    resend={() => requestJoin(address, name.trim())}
                                    submitLabel={copy.code.submit}
                                    verify={(code) => joinWithCode(address, code)}
                                />
                            )}
                        </Stack>
                    </Box>

                    <Box padding={5} radius='md' tone='surface-2'>
                        <Stack gap={4}>
                            <Heading level={2} size='md'>
                                {copy.node.title}
                            </Heading>
                            <Text tone='muted'>{copy.node.body}</Text>
                            <Row gap={3}>
                                <ButtonLink to='/connect' variant='secondary'>
                                    {copy.node.connect}
                                </ButtonLink>
                                <ButtonAnchor href={SITE.contact} variant='ghost'>
                                    {copy.node.ask}
                                </ButtonAnchor>
                            </Row>
                        </Stack>
                    </Box>
                </Grid>

                <Row gap={2}>
                    <Text as='span' size='sm' tone='muted'>
                        {copy.signIn.prompt}
                    </Text>
                    <TextLink size='sm' to='/sign-in'>
                        {copy.signIn.link}
                    </TextLink>
                </Row>
            </Section>
        </Page>
    )
}

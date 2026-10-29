import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { CodeStep } from '@components/account/CodeStep'
import { useConnectedNodes } from '@components/account/connectedNodes'
import { formErrorMessage, looksLikeEmail, safeNext } from '@components/account/flow'
import { NodeList } from '@components/account/NodeList'
import { useSession } from '@components/app/SessionProvider'
import { Page } from '@components/layout/Page'
import { TextField } from '@components/shared/forms/Field'
import { Form, FormActions } from '@components/shared/forms/Form'
import { Box, Grid, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button, ButtonLink, TextLink } from '@components/shared/widgets/Action'
import { joinWithCode, requestJoin } from '@core/api/auth'
import { addMyNodes } from '@core/api/people'
import { codeStepContent } from '@core/content/site/account/codeStep'
import { joinContent } from '@core/content/site/account/join'

const copy = joinContent

function SignInPrompt() {
    return (
        <Row gap={2}>
            <Text as='span' size='sm' tone='muted'>
                {copy.signIn.prompt}
            </Text>
            <TextLink size='sm' to='/sign-in'>
                {copy.signIn.link}
            </TextLink>
        </Row>
    )
}

/**
 * Membership is for people building the network: someone joins with the nodes
 * this browser connected on `/connect` (backend#9). Until a node has been
 * connected here, the page sends them there. The nodes stay in the browser
 * until the code is verified, and are added to the new account straight after.
 */
export function JoinPage() {
    const { session, signedIn } = useSession()
    const [params] = useSearchParams()
    const next = safeNext(params.get('next'))
    const nodes = useConnectedNodes()

    const [step, setStep] = useState<'details' | 'code'>('details')
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [busy, setBusy] = useState(false)
    const [emailError, setEmailError] = useState<string | undefined>()
    const [nameError, setNameError] = useState<string | undefined>()
    const [formError, setFormError] = useState<string | undefined>()

    if (session.status === 'signed_in') return <Navigate replace to={next} />

    if (nodes.length === 0) {
        return (
            <Page title={copy.title} lede={copy.lede}>
                <Section width='narrow'>
                    <Stack gap={5}>
                        <Box padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={2} size='md'>
                                    {copy.noNodes.title}
                                </Heading>
                                <Text tone='muted'>{copy.noNodes.body}</Text>
                                <Row>
                                    <ButtonLink to='/connect'>{copy.noNodes.connect}</ButtonLink>
                                </Row>
                            </Stack>
                        </Box>
                        <SignInPrompt />
                    </Stack>
                </Section>
            </Page>
        )
    }

    const address = email.trim()

    const submitDetails = async () => {
        setEmailError(undefined)
        setNameError(undefined)
        setFormError(undefined)
        const emailOk = looksLikeEmail(address)
        const nameOk = name.trim() !== ''
        if (!emailOk) setEmailError(codeStepContent.invalidEmail)
        if (!nameOk) setNameError(copy.form.nameInvalid)
        if (!emailOk || !nameOk) return

        setBusy(true)
        const result = await requestJoin(address, name.trim())
        setBusy(false)
        // Every address advances: the API answers them alike.
        if (result.ok) setStep('code')
        else setFormError(formErrorMessage(result.error))
    }

    return (
        <Page title={copy.title} lede={copy.lede}>
            <Section>
                <Stack gap={5}>
                    <Grid columns={2} minColumnWidth={320} gap={6} align='start'>
                        <Box padding={5} radius='md'>
                            <Stack gap={4}>
                                <Heading level={2} size='md'>
                                    {copy.form.title}
                                </Heading>
                                {step === 'details' ? (
                                    <Form
                                        ariaLabel={copy.form.title}
                                        busy={busy}
                                        onSubmit={(event) => {
                                            event.preventDefault()
                                            void submitDetails()
                                        }}
                                    >
                                        <Stack gap={4}>
                                            <TextField
                                                autoComplete='email'
                                                error={emailError}
                                                inputMode='email'
                                                label={copy.form.emailLabel}
                                                name='email'
                                                onChange={setEmail}
                                                required
                                                type='email'
                                                value={email}
                                            />
                                            <TextField
                                                autoComplete='name'
                                                error={nameError}
                                                label={copy.form.nameLabel}
                                                name='name'
                                                onChange={setName}
                                                required
                                                value={name}
                                            />
                                            <Text size='sm' tone='muted'>
                                                {copy.form.updates}
                                            </Text>
                                            <FormActions>
                                                <Button loading={busy} type='submit'>
                                                    {copy.form.submit}
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
                                        ariaLabel={copy.form.title}
                                        email={address}
                                        lede={copy.code.lede}
                                        noEmail={copy.code.noEmail}
                                        onChangeEmail={() => {
                                            setStep('details')
                                        }}
                                        onVerified={(user) => {
                                            // The verify response set the session cookie,
                                            // so the nodes can go first; marking the person
                                            // signed in then redirects, to a page that
                                            // already has them. If adding fails, the nodes
                                            // are still in the browser and /connect offers
                                            // to add them.
                                            void addMyNodes(nodes).finally(() => {
                                                signedIn(user)
                                            })
                                        }}
                                        resend={() => requestJoin(address, name.trim())}
                                        submitLabel={copy.code.submit}
                                        verify={(code) => joinWithCode(address, code)}
                                    />
                                )}
                            </Stack>
                        </Box>

                        <Box padding={5} radius='md' tone='surface-2'>
                            <Stack gap={3}>
                                <Heading level={2} size='md'>
                                    {copy.nodes.title}
                                </Heading>
                                <Text size='sm' tone='muted'>
                                    {copy.nodes.body}
                                </Text>
                                <NodeList nodes={nodes} unnamed={copy.nodes.unnamed} />
                            </Stack>
                        </Box>
                    </Grid>
                    <SignInPrompt />
                </Stack>
            </Section>
        </Page>
    )
}

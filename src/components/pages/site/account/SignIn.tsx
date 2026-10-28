import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { CodeStep } from '@components/account/CodeStep'
import { formErrorMessage, looksLikeEmail, safeNext } from '@components/account/flow'
import { useSession } from '@components/app/SessionProvider'
import { Page } from '@components/layout/Page'
import { TextField } from '@components/shared/forms/Field'
import { Form, FormActions } from '@components/shared/forms/Form'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button, TextLink } from '@components/shared/widgets/Action'
import { requestCode, signInWithCode } from '@core/api/auth'
import { codeStepContent } from '@core/content/site/account/codeStep'
import { signInContent } from '@core/content/site/account/signIn'

const copy = signInContent

export function SignInPage() {
    const { session, signedIn } = useSession()
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const next = safeNext(params.get('next'))

    const [step, setStep] = useState<'email' | 'code'>('email')
    const [email, setEmail] = useState('')
    const [busy, setBusy] = useState(false)
    const [fieldError, setFieldError] = useState<string | undefined>()
    const [formError, setFormError] = useState<string | undefined>()

    if (session.status === 'signed_in') return <Navigate replace to={next} />

    const address = email.trim()

    const submitEmail = async () => {
        setFieldError(undefined)
        setFormError(undefined)
        if (!looksLikeEmail(address)) {
            setFieldError(codeStepContent.invalidEmail)
            return
        }
        setBusy(true)
        const result = await requestCode(address)
        setBusy(false)
        // Every address advances: the API answers an unknown one exactly as a
        // known one, so the page cannot tell them apart and must not pretend to.
        if (result.ok) setStep('code')
        else if (result.error === 'INVALID_EMAIL') setFieldError(codeStepContent.invalidEmail)
        else setFormError(formErrorMessage(result.error))
    }

    return (
        <Page title={copy.title}>
            <Section width='narrow'>
                <Stack gap={5}>
                    {step === 'email' ? (
                        <Form
                            ariaLabel={copy.title}
                            busy={busy}
                            onSubmit={(event) => {
                                event.preventDefault()
                                void submitEmail()
                            }}
                        >
                            <Stack gap={4}>
                                <Text tone='muted'>{copy.email.lede}</Text>
                                <TextField
                                    autoComplete='email'
                                    error={fieldError}
                                    inputMode='email'
                                    label={copy.email.label}
                                    name='email'
                                    onChange={setEmail}
                                    required
                                    type='email'
                                    value={email}
                                />
                                <FormActions>
                                    <Button loading={busy} type='submit'>
                                        {copy.email.submit}
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
                            ariaLabel={copy.title}
                            email={address}
                            lede={copy.code.lede}
                            noEmail={copy.code.noEmail}
                            onChangeEmail={() => {
                                setStep('email')
                            }}
                            onVerified={(user) => {
                                signedIn(user)
                                void navigate(next, { replace: true })
                            }}
                            resend={() => requestCode(address)}
                            submitLabel={copy.code.submit}
                            verify={(code) => signInWithCode(address, code)}
                        />
                    )}
                    <Row gap={2}>
                        <Text as='span' size='sm' tone='muted'>
                            {copy.join.prompt}
                        </Text>
                        <TextLink size='sm' to='/join'>
                            {copy.join.link}
                        </TextLink>
                    </Row>
                </Stack>
            </Section>
        </Page>
    )
}

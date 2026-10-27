import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { useSession } from '@components/app/SessionProvider'
import { Page } from '@components/layout/Page'
import { TextField } from '@components/shared/forms/Field'
import { Form, FormActions } from '@components/shared/forms/Form'
import { Section, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { requestCode, signInWithCode } from '@core/api/auth'
import { signInContent } from '@core/content/site/signIn'

const copy = signInContent

/** Errors that belong to the code itself, shown on the field rather than the form. */
const CODE_ERRORS = ['INVALID_OTP', 'OTP_EXPIRED', 'TOO_MANY_ATTEMPTS'] as const
type CodeError = (typeof CODE_ERRORS)[number]

const isCodeError = (error: string): error is CodeError =>
    (CODE_ERRORS as readonly string[]).includes(error)

const formMessage = (error: string): string =>
    error === 'rate_limited' || error === 'unreachable' ? copy.errors[error] : copy.errors.fallback

/**
 * Where to go after signing in. Only a path on this site: an absolute URL or a
 * protocol-relative `//host` in `next` would turn the page into an open redirect.
 */
const safeNext = (next: string | null): string =>
    next !== null && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
        ? next
        : '/account'

/** People paste codes from email with spaces in them. */
const normaliseCode = (raw: string): string => raw.replaceAll(/\s/gu, '')

export function SignInPage() {
    const { session, signedIn } = useSession()
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const next = safeNext(params.get('next'))

    const [step, setStep] = useState<'email' | 'code'>('email')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [busy, setBusy] = useState(false)
    const [fieldError, setFieldError] = useState<string | undefined>()
    const [formError, setFormError] = useState<string | undefined>()
    const [resent, setResent] = useState(false)
    const codeInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (step === 'code') codeInputRef.current?.focus()
    }, [step])

    if (session.status === 'signed_in') return <Navigate replace to={next} />

    const clearMessages = () => {
        setFieldError(undefined)
        setFormError(undefined)
        setResent(false)
    }

    const sendCode = async (): Promise<boolean> => {
        setBusy(true)
        const result = await requestCode(email.trim())
        setBusy(false)
        if (result.ok) return true
        if (result.error === 'INVALID_EMAIL') setFieldError(copy.email.invalid)
        else setFormError(formMessage(result.error))
        return false
    }

    const submitEmail = async () => {
        clearMessages()
        if (!email.includes('@')) {
            setFieldError(copy.email.invalid)
            return
        }
        // Every address advances: the API answers an unknown one exactly as a
        // known one, so the page cannot tell them apart and must not pretend to.
        if (await sendCode()) setStep('code')
    }

    const submitCode = async () => {
        clearMessages()
        const digits = normaliseCode(code)
        if (!/^\d{6}$/u.test(digits)) {
            setFieldError(copy.code.invalid)
            return
        }
        setBusy(true)
        const result = await signInWithCode(email.trim(), digits)
        setBusy(false)
        if (result.ok) {
            signedIn(result.data)
            void navigate(next, { replace: true })
            return
        }
        if (isCodeError(result.error)) setFieldError(copy.errors[result.error])
        else setFormError(formMessage(result.error))
    }

    const resend = async () => {
        clearMessages()
        if (!(await sendCode())) return
        setCode('')
        setResent(true)
        codeInputRef.current?.focus()
    }

    const changeEmail = () => {
        clearMessages()
        setCode('')
        setStep('email')
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
                            </Stack>
                        </Form>
                    ) : (
                        <Form
                            ariaLabel={copy.title}
                            busy={busy}
                            onSubmit={(event) => {
                                event.preventDefault()
                                void submitCode()
                            }}
                        >
                            <Stack gap={4}>
                                <Text tone='muted'>
                                    {copy.code.lede.replace('{address}', () => email.trim())}
                                </Text>
                                <TextField
                                    autoComplete='one-time-code'
                                    description={copy.code.noEmail}
                                    error={fieldError}
                                    inputMode='numeric'
                                    inputRef={codeInputRef}
                                    label={copy.code.label}
                                    name='code'
                                    onChange={setCode}
                                    required
                                    value={code}
                                />
                                {resent ? (
                                    <Text role='status' size='sm' tone='live'>
                                        {copy.code.resent}
                                    </Text>
                                ) : null}
                                <FormActions>
                                    <Button disabled={busy} onClick={changeEmail} variant='ghost'>
                                        {copy.code.changeEmail}
                                    </Button>
                                    <Button
                                        disabled={busy}
                                        onClick={() => void resend()}
                                        variant='secondary'
                                    >
                                        {copy.code.resend}
                                    </Button>
                                    <Button loading={busy} type='submit'>
                                        {copy.code.submit}
                                    </Button>
                                </FormActions>
                            </Stack>
                        </Form>
                    )}
                    {formError === undefined ? null : (
                        <Text role='alert' size='sm' tone='dead'>
                            {formError}
                        </Text>
                    )}
                </Stack>
            </Section>
        </Page>
    )
}

import { useEffect, useRef, useState } from 'react'

import {
    codeErrorMessage,
    formErrorMessage,
    normaliseCode,
    useCooldown,
} from '@components/account/flow'
import { TextField } from '@components/shared/forms/Field'
import { Form, FormActions } from '@components/shared/forms/Form'
import { Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import type { SessionUser } from '@core/api/auth'
import type { ApiResult } from '@core/api/client'
import { codeStepContent } from '@core/content/site/account/codeStep'

const copy = codeStepContent

/**
 * The second half of signing in or joining: the person types the code from
 * their email. Shared so both pages behave identically — the same limits said
 * up front, the same cooldown before another code, the same messages.
 *
 * It never says a code was sent. The API answers every address alike, so the
 * page's own wording (`lede`) is phrased to be true either way.
 */
export function CodeStep({
    email,
    lede,
    noEmail,
    submitLabel,
    ariaLabel,
    verify,
    resend,
    onVerified,
    onChangeEmail,
}: {
    readonly email: string
    /** `{address}` is replaced with `email`. */
    readonly lede: string
    readonly noEmail: string
    readonly submitLabel: string
    readonly ariaLabel: string
    readonly verify: (code: string) => Promise<ApiResult<SessionUser>>
    readonly resend: () => Promise<ApiResult<unknown>>
    readonly onVerified: (user: SessionUser) => void
    readonly onChangeEmail: () => void
}) {
    const [code, setCode] = useState('')
    const [busy, setBusy] = useState(false)
    const [fieldError, setFieldError] = useState<string | undefined>()
    const [formError, setFormError] = useState<string | undefined>()
    const [resent, setResent] = useState(false)
    const cooldown = useCooldown()
    const inputRef = useRef<HTMLInputElement>(null)

    // The step appears after the email is sent; the person's next act is typing.
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const clearMessages = () => {
        setFieldError(undefined)
        setFormError(undefined)
        setResent(false)
    }

    const submit = async () => {
        clearMessages()
        const digits = normaliseCode(code)
        if (!/^\d{6}$/u.test(digits)) {
            setFieldError(copy.invalidCode)
            return
        }
        setBusy(true)
        const result = await verify(digits)
        setBusy(false)
        if (result.ok) {
            onVerified(result.data)
            return
        }
        const onField = codeErrorMessage(result.error)
        if (onField === undefined) setFormError(formErrorMessage(result.error))
        else setFieldError(onField)
    }

    const sendAnother = async () => {
        clearMessages()
        setBusy(true)
        const result = await resend()
        setBusy(false)
        if (!result.ok) {
            setFormError(formErrorMessage(result.error))
            return
        }
        setCode('')
        setResent(true)
        cooldown.restart()
        inputRef.current?.focus()
    }

    const waiting = cooldown.remaining > 0

    return (
        <Form
            ariaLabel={ariaLabel}
            busy={busy}
            onSubmit={(event) => {
                event.preventDefault()
                void submit()
            }}
        >
            <Stack gap={4}>
                <Stack gap={2}>
                    <Text tone='muted'>{lede.replace('{address}', () => email)}</Text>
                    <Text size='sm' tone='muted'>
                        {copy.limits}
                    </Text>
                </Stack>
                <TextField
                    autoComplete='one-time-code'
                    description={noEmail}
                    error={fieldError}
                    inputMode='numeric'
                    inputRef={inputRef}
                    label={copy.label}
                    name='code'
                    onChange={setCode}
                    required
                    value={code}
                />
                {resent ? (
                    <Text role='status' size='sm' tone='live'>
                        {copy.resent}
                    </Text>
                ) : null}
                <FormActions>
                    <Button disabled={busy} onClick={onChangeEmail} variant='ghost'>
                        {copy.changeEmail}
                    </Button>
                    <Button
                        disabled={busy || waiting}
                        onClick={() => void sendAnother()}
                        variant='secondary'
                    >
                        {waiting
                            ? copy.resendIn.replace('{seconds}', () => String(cooldown.remaining))
                            : copy.resend}
                    </Button>
                    <Button loading={busy} type='submit'>
                        {submitLabel}
                    </Button>
                </FormActions>
                {formError === undefined ? null : (
                    <Text role='alert' size='sm' tone='dead'>
                        {formError}
                    </Text>
                )}
            </Stack>
        </Form>
    )
}

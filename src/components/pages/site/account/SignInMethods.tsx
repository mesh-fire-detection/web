import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { formErrorMessage } from '@components/account/flow'
import { Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import {
    fetchMySignInMethods,
    removeGoogle,
    type SignInMethod,
    startLinkingGoogle,
} from '@core/api/auth'
import { accountContent } from '@core/content/site/account/account'

const copy = accountContent.signIn

/**
 * The emailed code, which every member has and cannot remove, and Google,
 * which they can add or remove. Google sends the person back here, with
 * `?error=` if it was not added.
 */
export function SignInMethods() {
    const [params] = useSearchParams()
    const [methods, setMethods] = useState<readonly SignInMethod[] | null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | undefined>(() =>
        params.has('error') ? copy.addFailed : undefined
    )

    useEffect(() => {
        let current = true
        void fetchMySignInMethods().then((result) => {
            if (current && result.ok) setMethods(result.data)
        })
        return () => {
            current = false
        }
    }, [])

    if (methods === null) return null
    const google = methods.some((method) => method.kind === 'google')

    const add = async () => {
        setError(undefined)
        setBusy(true)
        const result = await startLinkingGoogle(`${window.location.origin}/account`)
        if (result.ok) {
            // Stays busy: the page is about to be replaced by Google's.
            window.location.assign(result.data)
            return
        }
        setBusy(false)
        setError(
            result.error === 'PROVIDER_NOT_FOUND'
                ? copy.unavailable
                : formErrorMessage(result.error)
        )
    }

    const remove = async () => {
        setError(undefined)
        setBusy(true)
        const result = await removeGoogle()
        setBusy(false)
        if (result.ok) {
            setMethods(methods.filter((method) => method.kind !== 'google'))
            return
        }
        setError(formErrorMessage(result.error))
    }

    return (
        <Stack gap={3}>
            <Heading level={2} size='md'>
                {copy.title}
            </Heading>
            <Stack gap={1}>
                <Text weight={600}>{copy.code}</Text>
                <Text size='sm' tone='muted'>
                    {copy.codeNote}
                </Text>
            </Stack>
            <Stack gap={2}>
                <Text weight={600}>{copy.google}</Text>
                {google ? null : (
                    <Text size='sm' tone='muted'>
                        {copy.googleNote}
                    </Text>
                )}
                <Row>
                    <Button
                        loading={busy}
                        onClick={() => {
                            void (google ? remove() : add())
                        }}
                        variant='secondary'
                    >
                        {google ? copy.remove : copy.add}
                    </Button>
                </Row>
                {error === undefined ? null : (
                    <Text role='alert' size='sm' tone='dead'>
                        {error}
                    </Text>
                )}
            </Stack>
        </Stack>
    )
}

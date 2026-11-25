import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { formErrorMessage } from '@components/account/flow'
import { SettingList, SettingRow } from '@components/shared/page/List'
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
        <SettingList title={copy.title}>
            <SettingRow description={copy.codeNote} label={copy.code} />
            <SettingRow
                action={
                    <Button
                        loading={busy}
                        onClick={() => {
                            void (google ? remove() : add())
                        }}
                        variant='secondary'
                    >
                        {google ? copy.remove : copy.add}
                    </Button>
                }
                description={google ? undefined : copy.googleNote}
                label={copy.google}
            >
                {error === undefined ? null : (
                    <Text role='alert' size='sm' tone='dead'>
                        {error}
                    </Text>
                )}
            </SettingRow>
        </SettingList>
    )
}

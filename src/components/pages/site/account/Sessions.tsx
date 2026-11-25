import { useEffect, useState } from 'react'

import { formErrorMessage } from '@components/account/flow'
import { SettingList, SettingRow } from '@components/shared/page/List'
import { Row } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { endMySession, fetchMySessions, type MySession, signOutEverywhere } from '@core/api/auth'
import { accountContent } from '@core/content/site/account/account'

const copy = accountContent.sessions

const dayFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

const BROWSERS: readonly (readonly [RegExp, string])[] = [
    [/Edg\//u, 'Edge'],
    [/Firefox\//u, 'Firefox'],
    [/Chrome\//u, 'Chrome'],
    [/Safari\//u, 'Safari'],
]
const SYSTEMS: readonly (readonly [RegExp, string])[] = [
    [/Android/u, 'Android'],
    [/iPhone|iPad/u, 'iOS'],
    [/Windows/u, 'Windows'],
    [/Mac OS X/u, 'macOS'],
    [/Linux/u, 'Linux'],
]

/** "Chrome on Windows", enough to tell devices apart. Order matters: Edge also says Chrome. */
export function deviceName(userAgent: string | null): string {
    if (userAgent === null) return copy.unknownDevice
    const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1]
    const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1]
    if (browser === undefined) return system ?? copy.unknownDevice
    return system === undefined ? browser : `${browser} on ${system}`
}

/**
 * Where the person is signed in, a way to end any one of those, and to end
 * them all. Ending them all ends this one too, so the page is told.
 */
export function Sessions({ onSignedOut }: { readonly onSignedOut: () => void }) {
    const [sessions, setSessions] = useState<readonly MySession[] | null>(null)
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState<string | undefined>()

    useEffect(() => {
        let current = true
        void fetchMySessions().then((result) => {
            if (current && result.ok) setSessions(result.data)
        })
        return () => {
            current = false
        }
    }, [])

    if (sessions === null) return null

    const end = async (id: string) => {
        setError(undefined)
        setBusy(id)
        const result = await endMySession(id)
        setBusy(null)
        if (result.ok) {
            setSessions(sessions.filter((session) => session.id !== id))
            return
        }
        setError(formErrorMessage(result.error))
    }

    const endAll = async () => {
        setError(undefined)
        setBusy('all')
        const result = await signOutEverywhere()
        if (!result.ok) {
            setBusy(null)
            setError(formErrorMessage(result.error))
            return
        }
        onSignedOut()
    }

    return (
        <SettingList title={copy.title}>
            {sessions.map((session) => (
                <SettingRow
                    key={session.id}
                    action={
                        session.current ? null : (
                            <Button
                                loading={busy === session.id}
                                onClick={() => {
                                    void end(session.id)
                                }}
                                size='sm'
                                variant='ghost'
                            >
                                {copy.end}
                            </Button>
                        )
                    }
                    description={`${copy.lastActive} ${dayFormat.format(new Date(session.lastActiveAt))}`}
                    label={
                        <Row gap={2}>
                            {deviceName(session.userAgent)}
                            {session.current ? <Badge>{copy.thisBrowser}</Badge> : null}
                        </Row>
                    }
                />
            ))}
            <SettingRow
                action={
                    <Button
                        loading={busy === 'all'}
                        onClick={() => {
                            void endAll()
                        }}
                        variant='secondary'
                    >
                        {copy.everywhere}
                    </Button>
                }
                description={copy.everywhereNote}
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

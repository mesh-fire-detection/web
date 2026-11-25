import { useState } from 'react'

import { formErrorMessage } from '@components/account/flow'
import { SettingList, SettingRow } from '@components/shared/page/List'
import { Row } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { deleteMe } from '@core/api/auth'
import { accountContent } from '@core/content/site/account/account'

const copy = accountContent.leave

/**
 * Deleting the account, after saying plainly what happens to the person's
 * nodes and readings. Two steps, because it cannot be undone. Deleting ends
 * every session, so the page is told.
 */
export function LeaveAccount({ onSignedOut }: { readonly onSignedOut: () => void }) {
    const [confirming, setConfirming] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | undefined>()

    const leave = async () => {
        setError(undefined)
        setBusy(true)
        const result = await deleteMe()
        if (!result.ok) {
            setBusy(false)
            setError(result.error === 'conflict' ? copy.onlyAdmin : formErrorMessage(result.error))
            return
        }
        onSignedOut()
    }

    return (
        <SettingList title={copy.title}>
            <SettingRow
                action={
                    confirming ? (
                        <>
                            <Row gap={2}>
                                <Button
                                    disabled={busy}
                                    onClick={() => {
                                        setConfirming(false)
                                        setError(undefined)
                                    }}
                                    variant='ghost'
                                >
                                    {copy.cancel}
                                </Button>
                                <Button
                                    loading={busy}
                                    onClick={() => {
                                        void leave()
                                    }}
                                    variant='danger'
                                >
                                    {copy.confirm}
                                </Button>
                            </Row>
                            <Text size='xs' tone='faint'>
                                {copy.confirmNote}
                            </Text>
                        </>
                    ) : (
                        <Button
                            onClick={() => {
                                setConfirming(true)
                            }}
                            variant='secondary'
                        >
                            {copy.start}
                        </Button>
                    )
                }
            >
                {copy.body.map((paragraph) => (
                    <Text key={paragraph} size='sm' tone='muted'>
                        {paragraph}
                    </Text>
                ))}
                {error === undefined ? null : (
                    <Text role='alert' size='sm' tone='dead'>
                        {error}
                    </Text>
                )}
            </SettingRow>
        </SettingList>
    )
}

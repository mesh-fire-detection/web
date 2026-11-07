import { useState } from 'react'

import { formErrorMessage } from '@components/account/flow'
import { Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
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
        <Stack gap={3}>
            <Heading level={2} size='md'>
                {copy.title}
            </Heading>
            {copy.body.map((paragraph) => (
                <Text key={paragraph} tone='muted'>
                    {paragraph}
                </Text>
            ))}
            {confirming ? (
                <Stack gap={2}>
                    <Row gap={3}>
                        <Button
                            loading={busy}
                            onClick={() => {
                                void leave()
                            }}
                            variant='danger'
                        >
                            {copy.confirm}
                        </Button>
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
                    </Row>
                    <Text size='xs' tone='faint'>
                        {copy.confirmNote}
                    </Text>
                </Stack>
            ) : (
                <Row>
                    <Button
                        onClick={() => {
                            setConfirming(true)
                        }}
                        variant='secondary'
                    >
                        {copy.start}
                    </Button>
                </Row>
            )}
            {error === undefined ? null : (
                <Text role='alert' size='sm' tone='dead'>
                    {error}
                </Text>
            )}
        </Stack>
    )
}

import { useEffect, useState } from 'react'

import { useSession } from '@components/app/SessionProvider'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button, ButtonLink, TextLink } from '@components/shared/widgets/Action'
import { addMyNodes, fetchMyNodes, type NodeReport } from '@core/api/people'
import { membershipContent } from '@core/content/site/account/membership'

const copy = membershipContent

/** Signed in: offers to add whichever of these nodes the account does not have yet. */
function AddToAccount({ nodes }: { readonly nodes: readonly NodeReport[] }) {
    const [known, setKnown] = useState<ReadonlySet<number> | null>(null)
    const [state, setState] = useState<'idle' | 'busy' | 'added' | 'failed'>('idle')

    useEffect(() => {
        let current = true
        void fetchMyNodes().then((result) => {
            if (current) setKnown(new Set(result.ok ? result.data.map((n) => n.nodeNum) : []))
        })
        return () => {
            current = false
        }
    }, [])

    if (known === null) return null
    const missing = nodes.filter((node) => !known.has(node.nodeNum))

    return state === 'added' || missing.length === 0 ? (
        <Text role='status' size='sm' tone='live'>
            {state === 'added' ? copy.signedIn.added : copy.signedIn.allAdded}
        </Text>
    ) : (
        <Stack gap={2}>
            <Row>
                <Button
                    loading={state === 'busy'}
                    onClick={() => {
                        setState('busy')
                        void addMyNodes(missing).then((result) => {
                            if (!result.ok) {
                                setState('failed')
                                return
                            }
                            setKnown(new Set(result.data.map((n) => n.nodeNum)))
                            setState('added')
                        })
                    }}
                    variant='secondary'
                >
                    {copy.signedIn.add}
                </Button>
            </Row>
            {state === 'failed' ? (
                <Text role='alert' size='sm' tone='dead'>
                    {copy.signedIn.failed}
                </Text>
            ) : null}
        </Stack>
    )
}

/**
 * Shown on `/connect` once a node has connected and identified itself. Signed
 * out, it invites the person to become a member; the browser keeps the nodes,
 * so the invitation is still here, and in the footer, if they come back later.
 * Signed in, it adds the nodes to their account — a deliberate act, since
 * nothing about a node leaves the browser without one (web#4).
 */
export function MembershipPanel({ nodes }: { readonly nodes: readonly NodeReport[] }) {
    const { session } = useSession()
    return nodes.length === 0 || session.status === 'loading' ? null : (
        <Box padding={5} radius='md' tone='surface-2'>
            {session.status === 'signed_in' ? (
                <Stack gap={3}>
                    <Heading level={2} size='sm'>
                        {copy.signedIn.title}
                    </Heading>
                    <AddToAccount nodes={nodes} />
                </Stack>
            ) : (
                <Stack gap={3}>
                    <Heading level={2} size='sm'>
                        {copy.connect.title}
                    </Heading>
                    <Text size='sm' tone='muted'>
                        {copy.connect.body}
                    </Text>
                    <Row gap={4}>
                        <ButtonLink to='/join'>{copy.connect.cta}</ButtonLink>
                        <Row gap={2}>
                            <Text as='span' size='sm' tone='muted'>
                                {copy.connect.signIn.prompt}
                            </Text>
                            <TextLink size='sm' to='/sign-in?next=/connect'>
                                {copy.connect.signIn.link}
                            </TextLink>
                        </Row>
                    </Row>
                </Stack>
            )}
        </Box>
    )
}

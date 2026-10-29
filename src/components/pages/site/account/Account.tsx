import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { formErrorMessage } from '@components/account/flow'
import { NodeList } from '@components/account/NodeList'
import { useSession } from '@components/app/SessionProvider'
import { Page } from '@components/layout/Page'
import { TextField } from '@components/shared/forms/Field'
import { Form } from '@components/shared/forms/Form'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button, TextLink } from '@components/shared/widgets/Action'
import { renameMe, type SessionUser } from '@core/api/auth'
import {
    fetchMyNodes,
    fetchMySubscription,
    setMySubscription,
    type NodeReport,
    type SubscriptionStatus,
} from '@core/api/people'
import { accountContent } from '@core/content/site/account/account'
import { updatesContent } from '@core/content/site/account/updates'

const copy = accountContent

/**
 * The name is the member's to change. The address is how they sign in, so it
 * is shown but not editable here.
 */
function YourDetails({ user }: { readonly user: SessionUser }) {
    const { signedIn } = useSession()
    const [name, setName] = useState(user.name)
    const [busy, setBusy] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | undefined>()
    const trimmed = name.trim()
    const unchanged = trimmed === user.name

    return (
        <Form
            ariaLabel={copy.title}
            busy={busy}
            onSubmit={(event) => {
                event.preventDefault()
                setSaved(false)
                setError(undefined)
                if (trimmed === '') {
                    setError(copy.details.nameInvalid)
                    return
                }
                setBusy(true)
                void renameMe(trimmed).then((result) => {
                    setBusy(false)
                    if (!result.ok) {
                        setError(formErrorMessage(result.error))
                        return
                    }
                    signedIn(result.data)
                    setName(result.data.name)
                    setSaved(true)
                })
            }}
        >
            <Stack gap={4}>
                <TextField
                    autoComplete='name'
                    error={error}
                    label={copy.details.name}
                    name='name'
                    onChange={(next) => {
                        setName(next)
                        setSaved(false)
                    }}
                    required
                    value={name}
                />
                <Stack gap={1}>
                    <DescriptionList columns={1}>
                        <DescriptionItem term={copy.details.email}>{user.email}</DescriptionItem>
                    </DescriptionList>
                    <Text size='xs' tone='faint'>
                        {copy.details.emailFixed}
                    </Text>
                </Stack>
                <Row gap={3}>
                    <Button disabled={unchanged} loading={busy} type='submit'>
                        {copy.details.save}
                    </Button>
                    {saved ? (
                        <Text role='status' size='sm' tone='live'>
                            {copy.details.saved}
                        </Text>
                    ) : null}
                </Row>
            </Stack>
        </Form>
    )
}

function YourNodes() {
    const [nodes, setNodes] = useState<readonly NodeReport[] | null>(null)

    useEffect(() => {
        let current = true
        void fetchMyNodes().then((result) => {
            if (current) setNodes(result.ok ? result.data : [])
        })
        return () => {
            current = false
        }
    }, [])

    return (
        <Stack gap={3}>
            <Heading level={2} size='md'>
                {copy.nodes.title}
            </Heading>
            {nodes === null ? null : nodes.length === 0 ? (
                <Stack gap={2}>
                    <Text tone='muted'>{copy.nodes.empty}</Text>
                    <Row>
                        <TextLink to='/connect'>{copy.nodes.connect}</TextLink>
                    </Row>
                </Stack>
            ) : (
                <NodeList nodes={nodes} unnamed={copy.nodes.unnamed} />
            )}
        </Stack>
    )
}

/** Project updates on or off. Turning them on needs no email: joining proved the address. */
function UpdatesSetting() {
    const words = updatesContent.account
    const [status, setStatus] = useState<SubscriptionStatus | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let current = true
        void fetchMySubscription().then((result) => {
            if (current && result.ok) setStatus(result.data)
        })
        return () => {
            current = false
        }
    }, [])

    if (status === null) return null
    const on = status === 'confirmed'

    return (
        <Stack gap={3}>
            <Heading level={2} size='md'>
                {words.title}
            </Heading>
            <Text tone='muted'>{on ? words.on : words.off}</Text>
            <Row>
                <Button
                    loading={busy}
                    onClick={() => {
                        setBusy(true)
                        void setMySubscription(!on).then((result) => {
                            setBusy(false)
                            if (result.ok) setStatus(result.data)
                        })
                    }}
                    variant='secondary'
                >
                    {on ? words.turnOff : words.turnOn}
                </Button>
            </Row>
        </Stack>
    )
}

export function AccountPage() {
    const { session, signOut } = useSession()
    const navigate = useNavigate()

    if (session.status === 'signed_out') return <Navigate replace to='/sign-in?next=/account' />
    if (session.status === 'loading') return <Page title={copy.title}>{null}</Page>

    const { user } = session

    return (
        <Page title={copy.title}>
            <Section width='narrow'>
                <Stack gap={7}>
                    <YourDetails key={user.id} user={user} />
                    <YourNodes />
                    <UpdatesSetting />
                    <Row>
                        <Button
                            onClick={() => {
                                // Leave first: once the session reads signed out,
                                // this page's own guard would send the person to
                                // /sign-in instead of home.
                                void navigate('/', { replace: true })
                                void signOut()
                            }}
                            variant='secondary'
                        >
                            {copy.signOut}
                        </Button>
                    </Row>
                </Stack>
            </Section>
        </Page>
    )
}

import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { formErrorMessage, signInToSee } from '@components/account/flow'
import { backUpConnectedNodes } from '@components/account/nodeBackup'
import { useSession } from '@components/app/SessionProvider'
import { Page } from '@components/layout/Page'
import { LeaveAccount } from '@components/pages/site/account/LeaveAccount'
import { Sessions } from '@components/pages/site/account/Sessions'
import { SignInMethods } from '@components/pages/site/account/SignInMethods'
import { TextField } from '@components/shared/forms/Field'
import { Form } from '@components/shared/forms/Form'
import { DataTable } from '@components/shared/page/DataTable'
import { SettingList, SettingRow } from '@components/shared/page/List'
import { Box, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button, ButtonLink, TextLink } from '@components/shared/widgets/Action'
import { renameMe, type SessionUser } from '@core/api/auth'
import {
    fetchMyNodes,
    fetchMySubscription,
    setMySubscription,
    type MyNode,
    type SubscriptionStatus,
} from '@core/api/people'
import { accountContent } from '@core/content/site/account/account'
import { updatesContent } from '@core/content/site/account/updates'

const copy = accountContent

const dayFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' })

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
            <SettingList title={copy.details.title}>
                <SettingRow
                    action={
                        <Row gap={3}>
                            {saved ? (
                                <Text role='status' size='sm' tone='live'>
                                    {copy.details.saved}
                                </Text>
                            ) : null}
                            <Button disabled={unchanged} loading={busy} type='submit'>
                                {copy.details.save}
                            </Button>
                        </Row>
                    }
                    align={error === undefined ? 'end' : 'center'}
                >
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
                </SettingRow>
                <SettingRow
                    action={<Text size='sm'>{user.email}</Text>}
                    description={copy.details.emailFixed}
                    label={copy.details.email}
                />
                <SettingRow
                    action={<Text size='sm'>{dayFormat.format(new Date(user.createdAt))}</Text>}
                    label={copy.details.joined}
                />
            </SettingList>
        </Form>
    )
}

function YourNodes() {
    const [nodes, setNodes] = useState<readonly MyNode[] | null>(null)

    useEffect(() => {
        let current = true
        void fetchMyNodes().then((result) => {
            if (current) setNodes(result.ok ? result.data : [])
        })
        void backUpConnectedNodes()
        return () => {
            current = false
        }
    }, [])

    return (
        <SettingList
            action={
                <TextLink size='sm' to='/nodes'>
                    {copy.nodes.all}
                </TextLink>
            }
            title={copy.nodes.title}
        >
            {nodes === null ? null : nodes.length === 0 ? (
                <SettingRow
                    action={
                        <ButtonLink to='/connect' variant='secondary'>
                            {copy.nodes.connect}
                        </ButtonLink>
                    }
                    description={copy.nodes.empty}
                />
            ) : (
                <DataTable
                    columns={[
                        {
                            key: 'name',
                            header: copy.nodes.columns.name,
                            render: (node) => (node.name === '' ? copy.nodes.unnamed : node.name),
                        },
                        {
                            key: 'id',
                            header: copy.nodes.columns.id,
                            render: (node) => (
                                <Text as='span' mono size='sm'>
                                    {node.id}
                                </Text>
                            ),
                        },
                        {
                            key: 'meshId',
                            header: copy.nodes.columns.meshId,
                            render: (node) => (
                                <Text as='span' mono size='sm'>
                                    {node.meshId}
                                </Text>
                            ),
                        },
                        {
                            key: 'hardware',
                            header: copy.nodes.columns.hardware,
                            render: (node) => (
                                <Text as='span' size='sm' tone='muted'>
                                    {node.details?.hardware ?? '—'}
                                </Text>
                            ),
                        },
                    ]}
                    getRowKey={(node) => node.id}
                    label={copy.nodes.title}
                    rows={nodes}
                />
            )}
        </SettingList>
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
        <SettingList title={words.title}>
            <SettingRow
                action={
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
                }
                description={on ? words.on : words.off}
            />
        </SettingList>
    )
}

export function AccountPage() {
    const { session, signOut, signedOut } = useSession()
    const navigate = useNavigate()
    // Set when the person ended their own session from here, by signing out
    // everywhere or deleting the account: they are sent home, not to sign in.
    const [left, setLeft] = useState(false)

    if (session.status === 'signed_out') {
        return <Navigate replace to={left ? '/' : signInToSee('/account')} />
    }
    if (session.status === 'loading') return <Page title={copy.title}>{null}</Page>

    const { user } = session
    const leave = () => {
        setLeft(true)
        signedOut()
    }

    return (
        <Page title={copy.title}>
            <Section>
                <Stack gap={8}>
                    <YourDetails key={user.id} user={user} />
                    <YourNodes />
                    <UpdatesSetting />
                    <SignInMethods />
                    <Stack gap={0}>
                        <Sessions onSignedOut={leave} />
                        <SettingRow
                            action={
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
                            }
                            description={copy.signOutNote}
                        />
                    </Stack>
                    <Box tone='dead'>
                        <LeaveAccount onSignedOut={leave} />
                    </Box>
                </Stack>
            </Section>
        </Page>
    )
}

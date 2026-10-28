import { Navigate, useNavigate } from 'react-router-dom'

import { useSession } from '@components/app/SessionProvider'
import { Page } from '@components/layout/Page'
import { DescriptionItem, DescriptionList } from '@components/shared/page/List'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Button } from '@components/shared/widgets/Action'
import { accountContent } from '@core/content/site/account/account'

const copy = accountContent

export function AccountPage() {
    const { session, signOut } = useSession()
    const navigate = useNavigate()

    if (session.status === 'signed_out') return <Navigate replace to='/sign-in?next=/account' />
    if (session.status === 'loading') return <Page title={copy.title}>{null}</Page>

    const { user } = session

    return (
        <Page title={copy.title}>
            <Section width='narrow'>
                <Stack gap={6}>
                    <DescriptionList columns={1}>
                        <DescriptionItem term={copy.labels.name}>{user.name}</DescriptionItem>
                        <DescriptionItem term={copy.labels.email}>{user.email}</DescriptionItem>
                        <DescriptionItem term={copy.labels.role}>
                            {copy.roles[user.role]}
                        </DescriptionItem>
                    </DescriptionList>
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

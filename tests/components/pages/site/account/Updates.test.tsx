// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { FooterSignup } from '@components/account/FooterSignup'
import { MembershipPanel } from '@components/account/MembershipPanel'
import { SessionProvider } from '@components/app/SessionProvider'
import { SubscribeConfirmPage } from '@components/pages/site/account/SubscribeConfirm'

import {
    BENCH_NODE,
    json,
    MEMBER,
    rememberNode,
    sentBodies,
    stubApi,
} from '../../../../support/api'

afterEach(() => {
    cleanup()
    window.localStorage.clear()
})

const SESSION = 'GET /v1/auth/get-session'
const SIGNED_OUT = { [SESSION]: json(null) }
const SIGNED_IN = { [SESSION]: json({ session: {}, user: MEMBER }) }

function renderWithSession(ui: ReactNode, path = '/') {
    render(
        <MemoryRouter initialEntries={[path]}>
            <SessionProvider>{ui}</SessionProvider>
        </MemoryRouter>
    )
}

describe('the footer', () => {
    it('lets a visitor subscribe, and says only to check their inbox', async () => {
        const user = userEvent.setup()
        const api = stubApi({ ...SIGNED_OUT, 'POST /v1/subscribe': json({ success: true }) })
        renderWithSession(<FooterSignup />)

        await user.type(await screen.findByLabelText('Email'), 'reader@example.org')
        await user.click(screen.getByRole('button', { name: 'Subscribe' }))

        expect(await screen.findByText('Check your inbox to confirm.')).toBeDefined()
        expect(sentBodies(api, '/v1/subscribe')).toEqual([{ email: 'reader@example.org' }])
    })

    it('shows the words the backend records as consent', async () => {
        stubApi(SIGNED_OUT)
        renderWithSession(<FooterSignup />)

        expect(
            await screen.findByText(
                'Occasional project updates by email. Confirm by the link we send; stop any time.'
            )
        ).toBeDefined()
    })

    it('invites a browser that has connected a node to become a member instead', async () => {
        rememberNode()
        stubApi(SIGNED_OUT)
        renderWithSession(<FooterSignup />)

        const link = await screen.findByRole('link', { name: 'Become a member' })
        expect(link.getAttribute('href')).toBe('/join')
        expect(screen.queryByRole('button', { name: 'Subscribe' })).toBeNull()
    })

    it('switches to membership when a node connects in the /connect tab', async () => {
        stubApi(SIGNED_OUT)
        renderWithSession(<FooterSignup />)
        expect(await screen.findByRole('button', { name: 'Subscribe' })).toBeDefined()

        // /connect opens in its own tab; this tab hears about it through `storage`.
        rememberNode()
        act(() => {
            window.dispatchEvent(new StorageEvent('storage'))
        })

        expect(await screen.findByRole('link', { name: 'Become a member' })).toBeDefined()
    })

    it('asks a signed-in member for nothing', async () => {
        rememberNode()
        const api = stubApi(SIGNED_IN)
        renderWithSession(<FooterSignup />)

        // Let the session answer, then check nothing appeared.
        await waitFor(() => {
            expect(api).toHaveBeenCalled()
        })
        await act(async () => {
            await Promise.resolve()
        })
        expect(screen.queryByRole('button', { name: 'Subscribe' })).toBeNull()
        expect(screen.queryByRole('link', { name: 'Become a member' })).toBeNull()
    })
})

describe('the prompt on /connect', () => {
    it('invites a signed-out person whose node connected to become a member', async () => {
        stubApi(SIGNED_OUT)
        renderWithSession(<MembershipPanel nodes={[BENCH_NODE]} />)

        const link = await screen.findByRole('link', { name: 'Become a member' })
        expect(link.getAttribute('href')).toBe('/join')
        expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe(
            '/sign-in?next=/connect'
        )
    })

    it('adds the node to a signed-in member’s account when asked', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            ...SIGNED_IN,
            'GET /v1/me/nodes': json({ nodes: [] }),
            'POST /v1/me/nodes': json({
                nodes: [{ ...BENCH_NODE, addedAt: BENCH_NODE.connectedAt }],
            }),
        })
        renderWithSession(<MembershipPanel nodes={[BENCH_NODE]} />)

        await user.click(await screen.findByRole('button', { name: 'Add to my account' }))

        expect(await screen.findByText('Added to your account.')).toBeDefined()
        expect(sentBodies(api, '/v1/me/nodes')).toEqual([{ nodes: [BENCH_NODE] }])
    })

    it('says so when every node is already on the account', async () => {
        stubApi({
            ...SIGNED_IN,
            'GET /v1/me/nodes': json({
                nodes: [{ ...BENCH_NODE, addedAt: BENCH_NODE.connectedAt }],
            }),
        })
        renderWithSession(<MembershipPanel nodes={[BENCH_NODE]} />)

        expect(await screen.findByText('Every node here is on your account.')).toBeDefined()
    })

    it('shows nothing until a node has connected', () => {
        stubApi(SIGNED_OUT)
        renderWithSession(<MembershipPanel nodes={[]} />)

        expect(screen.queryByText('Become a member')).toBeNull()
    })
})

describe('confirming from the email link', () => {
    const renderConfirm = (path: string) => {
        render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route element={<SubscribeConfirmPage />} path='/subscribe/confirm' />
                </Routes>
            </MemoryRouter>
        )
    }

    it('confirms on the button, never on arrival', async () => {
        const user = userEvent.setup()
        const api = stubApi({ 'POST /v1/subscribe/confirm': json({ success: true }) })
        renderConfirm('/subscribe/confirm?token=abc')

        expect(sentBodies(api, '/v1/subscribe/confirm')).toEqual([])
        await user.click(screen.getByRole('button', { name: 'Confirm subscription' }))

        expect(await screen.findByText("You're subscribed. Thank you.")).toBeDefined()
        expect(sentBodies(api, '/v1/subscribe/confirm')).toEqual([{ token: 'abc' }])
    })

    it('explains a link that is used up or wrong', async () => {
        const user = userEvent.setup()
        stubApi({
            'POST /v1/subscribe/confirm': json(
                { error: { code: 'bad_request', message: 'from the API' } },
                400
            ),
        })
        renderConfirm('/subscribe/confirm?token=old')

        await user.click(screen.getByRole('button', { name: 'Confirm subscription' }))

        expect(
            await screen.findByText('This link is invalid or has already been used.')
        ).toBeDefined()
    })

    it('says what is missing when opened without the link', () => {
        stubApi({})
        renderConfirm('/subscribe/confirm')

        expect(
            screen.getByText('This page needs the link from your confirmation email.')
        ).toBeDefined()
    })
})

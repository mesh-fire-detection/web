// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { SessionProvider } from '@components/app/SessionProvider'
import { AccountPage } from '@components/pages/site/account/Account'
import { JoinPage } from '@components/pages/site/account/Join'

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
const JOIN = 'POST /v1/join'
const VERIFY = 'POST /v1/auth/email-otp/verify-email'
const ADD_NODES = 'POST /v1/me/nodes'

function renderJoin() {
    render(
        <MemoryRouter initialEntries={['/join']}>
            <SessionProvider>
                <Routes>
                    <Route element={<JoinPage />} path='/join' />
                    <Route element={<AccountPage />} path='/account' />
                </Routes>
            </SessionProvider>
        </MemoryRouter>
    )
}

async function reachCodeStep(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText('Email'), 'ada@example.org')
    await user.type(screen.getByLabelText('Your name'), 'Ada Lovelace')
    await user.click(screen.getByRole('button', { name: 'Send code' }))
    return screen.findByLabelText('Code')
}

describe('Join, before this browser has connected a node', () => {
    it('sends the person to connect one, and existing members to sign in', async () => {
        stubApi({ [SESSION]: json(null) })
        renderJoin()

        expect(await screen.findByText('Start by connecting your node')).toBeDefined()
        const connect = screen.getByRole('link', { name: 'Connect a Node' })
        expect(connect.getAttribute('href')).toBe('/connect')
        expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/sign-in')
        // No way in without a node: no form at all.
        expect(screen.queryByLabelText('Email')).toBeNull()
    })
})

describe('Join, with a node this browser connected', () => {
    it('joins, adds the node to the new account, and lands on it', async () => {
        rememberNode()
        const user = userEvent.setup()
        const api = stubApi({
            [SESSION]: json(null),
            [JOIN]: json({ success: true }),
            [VERIFY]: json({ status: true, token: 't', user: MEMBER }),
            [ADD_NODES]: json({ nodes: [{ ...BENCH_NODE, addedAt: BENCH_NODE.connectedAt }] }),
        })
        renderJoin()

        expect(await screen.findByText('Bench node')).toBeDefined()
        const code = await reachCodeStep(user)
        expect(screen.getByText('If ada@example.org can join, a code is on its way.')).toBeDefined()

        await user.type(code, '654321')
        await user.click(screen.getByRole('button', { name: 'Join' }))

        expect(await screen.findByRole('heading', { name: 'Account' })).toBeDefined()
        expect(sentBodies(api, '/v1/join')).toEqual([
            { email: 'ada@example.org', name: 'Ada Lovelace', withNode: true },
        ])
        // The node leaves the browser only now, after the code made them a member.
        expect(sentBodies(api, '/v1/me/nodes')).toEqual([{ nodes: [BENCH_NODE] }])
        const order = api.mock.calls.map(([input]) => new URL(input).pathname)
        expect(order.indexOf('/v1/me/nodes')).toBeGreaterThan(
            order.indexOf('/v1/auth/email-otp/verify-email')
        )
    })

    it('says plainly that joining also subscribes you', async () => {
        rememberNode()
        stubApi({ [SESSION]: json(null) })
        renderJoin()

        expect(
            await screen.findByText(
                'Joining also signs you up for occasional project updates. You can stop them at any time.'
            )
        ).toBeDefined()
    })

    it('asks for both an address and a name before calling the server', async () => {
        rememberNode()
        const user = userEvent.setup()
        const api = stubApi({ [SESSION]: json(null) })
        renderJoin()

        // The browser's own checks stop a malformed address before the page sees it.
        await user.type(await screen.findByLabelText('Email'), 'not-an-address')
        await user.click(screen.getByRole('button', { name: 'Send code' }))
        expect(screen.getByLabelText<HTMLInputElement>('Email').checkValidity()).toBe(false)

        // A name of only spaces satisfies the browser, so the page checks it.
        await user.clear(screen.getByLabelText('Email'))
        await user.type(screen.getByLabelText('Email'), 'ada@example.org')
        await user.type(screen.getByLabelText('Your name'), ' '.repeat(3))
        await user.click(screen.getByRole('button', { name: 'Send code' }))

        expect(await screen.findByText('Enter your name.')).toBeDefined()
        expect(sentBodies(api, '/v1/join')).toEqual([])
    })

    it('stays on the first step when rate limited', async () => {
        rememberNode()
        const user = userEvent.setup()
        stubApi({ [SESSION]: json(null), [JOIN]: json({}, 429) })
        renderJoin()

        await user.type(await screen.findByLabelText('Email'), 'ada@example.org')
        await user.type(screen.getByLabelText('Your name'), 'Ada')
        await user.click(screen.getByRole('button', { name: 'Send code' }))

        expect(
            await screen.findByText('Too many requests. Wait a few minutes and try again.')
        ).toBeDefined()
        expect(screen.queryByLabelText('Code')).toBeNull()
    })
})

it('sends someone already signed in straight to their account', async () => {
    stubApi({ [SESSION]: json({ session: {}, user: MEMBER }) })
    renderJoin()

    expect(await screen.findByRole('heading', { name: 'Account' })).toBeDefined()
})

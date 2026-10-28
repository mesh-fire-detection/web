// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { SessionProvider } from '@components/app/SessionProvider'
import { AccountPage } from '@components/pages/site/account/Account'
import { JoinPage } from '@components/pages/site/account/Join'

import { json, MEMBER, sentBodies, stubApi } from '../../../../support/api'

afterEach(cleanup)

const SESSION = 'GET /v1/auth/get-session'
const JOIN = 'POST /v1/join'
const VERIFY = 'POST /v1/auth/email-otp/verify-email'

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

describe('Join', () => {
    it('joins with an invitation and lands on the account page as a member', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            [SESSION]: json(null),
            [JOIN]: json({ success: true }),
            [VERIFY]: json({ status: true, token: 't', user: MEMBER }),
        })
        renderJoin()

        const code = await reachCodeStep(user)
        // The same words whether or not the address is invited.
        expect(
            screen.getByText('If ada@example.org is on our list, a code is on its way.')
        ).toBeDefined()
        expect(document.activeElement).toBe(code)

        await user.type(code, '654321')
        await user.click(screen.getByRole('button', { name: 'Join' }))

        expect(await screen.findByRole('heading', { name: 'Account' })).toBeDefined()
        expect(screen.getByText('Member')).toBeDefined()
        expect(sentBodies(api, '/v1/join')).toEqual([
            { email: 'ada@example.org', name: 'Ada Lovelace' },
        ])
        expect(sentBodies(api, '/v1/auth/email-otp/verify-email')).toEqual([
            { email: 'ada@example.org', otp: '654321' },
        ])
    })

    it('says plainly that joining also subscribes you', async () => {
        stubApi({ [SESSION]: json(null) })
        renderJoin()

        expect(
            await screen.findByText(
                'Joining also signs you up for occasional project updates. You can stop them at any time.'
            )
        ).toBeDefined()
    })

    it('asks for both an address and a name before calling the server', async () => {
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

    it('explains an invitation withdrawn while its code was unused', async () => {
        const user = userEvent.setup()
        stubApi({
            [SESSION]: json(null),
            [JOIN]: json({ success: true }),
            [VERIFY]: json({ code: 'NOT_INVITED', message: 'from the API' }, 403),
        })
        renderJoin()

        await user.type(await reachCodeStep(user), '654321')
        await user.click(screen.getByRole('button', { name: 'Join' }))

        expect(
            await screen.findByText('This invitation is no longer open. Ask whoever invited you.')
        ).toBeDefined()
    })

    it('stays on the first step when rate limited', async () => {
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

    it('points builders to /connect and existing members to sign in', async () => {
        stubApi({ [SESSION]: json(null) })
        renderJoin()

        const connect = await screen.findByRole('link', { name: 'Connect a Node' })
        expect(connect.getAttribute('href')).toBe('/connect')
        expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/sign-in')
        expect(
            screen.getByRole('link', { name: 'Ask for an invitation' }).getAttribute('href')
        ).toBe('mailto:contact@meshfiredetection.org')
    })

    it('sends someone already signed in straight to their account', async () => {
        stubApi({ [SESSION]: json({ session: {}, user: MEMBER }) })
        renderJoin()

        expect(await screen.findByRole('heading', { name: 'Account' })).toBeDefined()
    })
})

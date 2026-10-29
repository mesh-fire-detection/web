// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@components/app/SessionProvider'
import { AccountPage } from '@components/pages/site/account/Account'
import { SignInPage } from '@components/pages/site/account/SignIn'

import { json, MEMBER, sentBodies, stubApi } from '../../../../support/api'

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

const SEND = 'POST /v1/auth/email-otp/send-verification-otp'
const VERIFY = 'POST /v1/auth/sign-in/email-otp'
const SESSION = 'GET /v1/auth/get-session'

const Where = () => <div data-testid='where'>{useLocation().pathname}</div>

function renderAt(path: string) {
    render(
        <MemoryRouter initialEntries={[path]}>
            <SessionProvider>
                <Routes>
                    <Route element={<SignInPage />} path='/sign-in' />
                    <Route element={<AccountPage />} path='/account' />
                    <Route element={<Where />} path='*' />
                </Routes>
            </SessionProvider>
        </MemoryRouter>
    )
}

async function reachCodeStep(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText('Email'), 'ada@example.org')
    await user.click(screen.getByRole('button', { name: 'Send code' }))
    return screen.findByLabelText('Code')
}

describe('Sign in', () => {
    it('signs in with an emailed code and lands on the account page', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            [SESSION]: json(null),
            [SEND]: json({ success: true }),
            [VERIFY]: json({ token: 't', user: MEMBER }),
        })
        renderAt('/sign-in')

        const code = await reachCodeStep(user)
        // Never "we sent": the page cannot know whether the address has an account.
        expect(
            screen.getByText('If ada@example.org can sign in, a code is on its way.')
        ).toBeDefined()
        expect(
            screen.getByText('A code works once, for ten minutes, and allows three tries.')
        ).toBeDefined()
        expect(document.activeElement).toBe(code)

        // Pasted from an email, with a space in the middle.
        await user.type(code, '123 456')
        await user.click(screen.getByRole('button', { name: 'Sign in' }))

        expect(await screen.findByRole('heading', { name: 'Account' })).toBeDefined()
        expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Ada Lovelace')
        expect(screen.getByText('ada@example.org')).toBeDefined()

        expect(sentBodies(api, '/v1/auth/email-otp/send-verification-otp')).toEqual([
            { email: 'ada@example.org', type: 'sign-in' },
        ])
        expect(sentBodies(api, '/v1/auth/sign-in/email-otp')).toEqual([
            { email: 'ada@example.org', otp: '123456' },
        ])
        for (const [, init] of api.mock.calls) expect(init?.credentials).toBe('include')
    })

    it.each([
        ['INVALID_OTP', 400, "That code doesn't match. Check it and try again."],
        ['OTP_EXPIRED', 400, 'That code has expired. Send a new one.'],
        ['TOO_MANY_ATTEMPTS', 403, 'Too many tries with that code. Send a new one.'],
    ])('explains %s on the code field', async (code, status, message) => {
        const user = userEvent.setup()
        stubApi({
            [SESSION]: json(null),
            [SEND]: json({ success: true }),
            [VERIFY]: json({ code, message: 'from the API' }, status),
        })
        renderAt('/sign-in')

        await user.type(await reachCodeStep(user), '000000')
        await user.click(screen.getByRole('button', { name: 'Sign in' }))

        expect(await screen.findByText(message)).toBeDefined()
        expect(screen.getByLabelText('Code').getAttribute('aria-invalid')).toBe('true')
    })

    it('stays on the email step when rate limited', async () => {
        const user = userEvent.setup()
        stubApi({ [SESSION]: json(null), [SEND]: json({}, 429) })
        renderAt('/sign-in')

        await user.type(await screen.findByLabelText('Email'), 'ada@example.org')
        await user.click(screen.getByRole('button', { name: 'Send code' }))

        expect(
            await screen.findByText('Too many requests. Wait a few minutes and try again.')
        ).toBeDefined()
        expect(screen.queryByLabelText('Code')).toBeNull()
    })

    it('says so when the server cannot be reached', async () => {
        const user = userEvent.setup()
        stubApi({ [SESSION]: 'offline', [SEND]: 'offline' })
        renderAt('/sign-in')

        await user.type(await screen.findByLabelText('Email'), 'ada@example.org')
        await user.click(screen.getByRole('button', { name: 'Send code' }))

        expect(
            await screen.findByText("Can't reach the server right now. Try again in a moment.")
        ).toBeDefined()
    })

    it('offers a way to join for people without an account', async () => {
        stubApi({ [SESSION]: json(null) })
        renderAt('/sign-in')

        const link = await screen.findByRole('link', { name: 'Join' })
        expect(link.getAttribute('href')).toBe('/join')
    })

    it('checks the code is six digits before asking the server', async () => {
        const user = userEvent.setup()
        const api = stubApi({ [SESSION]: json(null), [SEND]: json({ success: true }) })
        renderAt('/sign-in')

        await user.type(await reachCodeStep(user), '12345')
        await user.click(screen.getByRole('button', { name: 'Sign in' }))

        expect(await screen.findByText('The code is six digits.')).toBeDefined()
        expect(sentBodies(api, '/v1/auth/sign-in/email-otp')).toEqual([])
    })

    it('waits before sending a new code, then sends one and restarts the wait', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
        const api = stubApi({ [SESSION]: json(null), [SEND]: json({ success: true }) })
        renderAt('/sign-in')

        await user.type(await reachCodeStep(user), '1')
        const waiting = screen.getByRole<HTMLButtonElement>('button', {
            name: /Send a new code in \d+ s/,
        })
        expect(waiting.disabled).toBe(true)

        act(() => {
            vi.advanceTimersByTime(30_000)
        })
        await user.click(await screen.findByRole('button', { name: 'Send a new code' }))

        expect(
            await screen.findByText('New code sent. The previous one no longer works.')
        ).toBeDefined()
        // The wait starts again, because that request spent an email too.
        expect(screen.getByRole('button', { name: /Send a new code in \d+ s/ })).toBeDefined()
        expect(screen.getByLabelText<HTMLInputElement>('Code').value).toBe('')
        expect(sentBodies(api, '/v1/auth/email-otp/send-verification-otp')).toHaveLength(2)

        await user.click(screen.getByRole('button', { name: 'Use a different email' }))
        expect(screen.getByLabelText<HTMLInputElement>('Email').value).toBe('ada@example.org')
    })

    it.each([
        ['/map', '/map'],
        ['https://example.com', '/account'],
        ['//example.com', '/account'],
    ])('after signing in with next=%s, goes to %s', async (next, expected) => {
        const user = userEvent.setup()
        stubApi({
            [SESSION]: json(null),
            [SEND]: json({ success: true }),
            [VERIFY]: json({ token: 't', user: MEMBER }),
        })
        renderAt(`/sign-in?next=${encodeURIComponent(next)}`)

        await user.type(await reachCodeStep(user), '123456')
        await user.click(screen.getByRole('button', { name: 'Sign in' }))

        if (expected === '/account') {
            expect(await screen.findByRole('heading', { name: 'Account' })).toBeDefined()
        } else {
            const where = await screen.findByTestId('where')
            expect(where.textContent).toBe(expected)
        }
    })

    it('sends someone already signed in straight to their account', async () => {
        stubApi({ [SESSION]: json({ session: {}, user: MEMBER }) })
        renderAt('/sign-in')

        expect(await screen.findByRole('heading', { name: 'Account' })).toBeDefined()
    })
})

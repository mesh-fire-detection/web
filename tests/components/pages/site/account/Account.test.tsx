// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NavMenuProvider } from '@components/app/NavMenuProvider'
import { SessionProvider } from '@components/app/SessionProvider'
import { UnitsProvider } from '@components/app/UnitsProvider'
import { Header } from '@components/layout/Header'
import { AccountPage } from '@components/pages/site/account/Account'
import { deviceName } from '@components/pages/site/account/Sessions'

import { json, MEMBER, sentBodies, stubApi } from '../../../../support/api'

afterEach(cleanup)

const SESSION = 'GET /v1/auth/get-session'

const Where = () => {
    const { pathname, search } = useLocation()
    return <div data-testid='where'>{`${pathname}${search}`}</div>
}

function renderAt(path: string) {
    render(
        <MemoryRouter initialEntries={[path]}>
            <SessionProvider>
                <UnitsProvider>
                    <NavMenuProvider>
                        <Header />
                        <Routes>
                            <Route element={<AccountPage />} path='/account' />
                            <Route element={<Where />} path='*' />
                        </Routes>
                    </NavMenuProvider>
                </UnitsProvider>
            </SessionProvider>
        </MemoryRouter>
    )
}

describe('Account', () => {
    it('sends a signed-out visitor to sign in, and back here afterwards', async () => {
        stubApi({ [SESSION]: json(null) })
        renderAt('/account')

        const where = await screen.findByTestId('where')
        expect(where.textContent).toBe('/sign-in?next=%2Faccount&why=members')
    })

    it('signs out, returns home, and the header offers Join again', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            [SESSION]: json({ session: {}, user: { ...MEMBER, role: 'admin' } }),
            'POST /v1/auth/sign-out': json({ success: true }),
        })
        renderAt('/account')

        expect(await screen.findByLabelText('Name')).toBeDefined()
        await user.click(screen.getByRole('button', { name: 'Sign out' }))

        const where = await screen.findByTestId('where')
        expect(where.textContent).toBe('/')
        expect(await screen.findByRole('link', { name: 'Join' })).toBeDefined()
        expect(sentBodies(api, '/v1/auth/sign-out')).toEqual([{}])
    })
})

describe('Account details', () => {
    it('saves a new name, and keeps the address and role off the page', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            [SESSION]: json({ session: {}, user: MEMBER }),
            'PATCH /v1/me': json({ user: { ...MEMBER, name: 'Augusta Ada King' } }),
        })
        renderAt('/account')

        const name = await screen.findByLabelText<HTMLInputElement>('Name')
        const save = screen.getByRole<HTMLButtonElement>('button', { name: 'Save' })
        // Nothing to save until something changes.
        expect(save.disabled).toBe(true)
        // The address is shown, not offered for editing.
        expect(screen.getByText(MEMBER.email)).toBeDefined()
        expect(screen.queryByLabelText('Email')).toBeNull()
        expect(screen.queryByText('Member')).toBeNull()

        await user.clear(name)
        await user.type(name, 'Augusta Ada King')
        await user.click(save)

        expect(await screen.findByText('Saved.')).toBeDefined()
        expect(sentBodies(api, '/v1/me')).toEqual([{ name: 'Augusta Ada King' }])
    })

    it('refuses an empty name before calling the server', async () => {
        const user = userEvent.setup()
        const api = stubApi({ [SESSION]: json({ session: {}, user: MEMBER }) })
        renderAt('/account')

        const name = await screen.findByLabelText('Name')
        await user.clear(name)
        await user.type(name, ' '.repeat(3))
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(await screen.findByText('Enter your name.')).toBeDefined()
        expect(sentBodies(api, '/v1/me')).toEqual([])
    })
})

describe('Header account link', () => {
    it('shows nothing until the session check answers', () => {
        stubApi({ [SESSION]: 'pending' })
        renderAt('/')

        expect(screen.queryByRole('link', { name: 'Join' })).toBeNull()
        expect(screen.queryByRole('link', { name: 'Account' })).toBeNull()
    })

    it('offers a visitor the way to join', async () => {
        stubApi({ [SESSION]: json(null) })
        renderAt('/')

        const link = await screen.findByRole('link', { name: 'Join' })
        expect(link.getAttribute('href')).toBe('/join')
    })

    it('shows a signed-in person an account icon, not their name', async () => {
        stubApi({ [SESSION]: json({ session: {}, user: MEMBER }) })
        renderAt('/')

        const link = await screen.findByRole('link', { name: 'Account' })
        expect(link.getAttribute('href')).toBe('/account')
        expect(screen.queryByText(MEMBER.name)).toBeNull()
    })

    it('treats an unreachable API as signed out, so the site still works', async () => {
        stubApi({ [SESSION]: 'offline' })
        renderAt('/')

        expect(await screen.findByRole('link', { name: 'Join' })).toBeDefined()
    })
})

const SIGNED_IN = { [SESSION]: json({ session: {}, user: MEMBER }) }
const NO_CONTENT = () => new Response(null, { status: 204 })
const CODE_ONLY = { methods: [{ kind: 'code', removable: false }] }
const WITH_GOOGLE = {
    methods: [
        { kind: 'code', removable: false },
        { kind: 'google', removable: true },
    ],
}
const LAPTOP = {
    id: 's-laptop',
    current: true,
    userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
    createdAt: '2026-11-01T10:00:00.000Z',
    lastActiveAt: '2026-11-06T10:00:00.000Z',
    expiresAt: '2026-11-13T10:00:00.000Z',
}
const PHONE = {
    id: 's-phone',
    current: false,
    userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    createdAt: '2026-10-28T10:00:00.000Z',
    lastActiveAt: '2026-11-02T10:00:00.000Z',
    expiresAt: '2026-11-09T10:00:00.000Z',
}

/** The calls made with one method to one path. */
const callsTo = (api: ReturnType<typeof stubApi>, method: string, path: string) =>
    api.mock.calls.filter(
        ([input, init]) => (init?.method ?? 'GET') === method && new URL(input).pathname === path
    )

describe('Account joined date', () => {
    it('says when the account was made', async () => {
        stubApi(SIGNED_IN)
        renderAt('/account')

        expect(await screen.findByText('Joined')).toBeDefined()
        const shown = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
            new Date(MEMBER.createdAt)
        )
        expect(screen.getByText(shown)).toBeDefined()
    })
})

describe('Account sign-in methods', () => {
    const realLocation = window.location

    /** jsdom cannot leave the page, so `assign` is recorded instead of followed. */
    function stubLocation() {
        const assign = vi.fn()
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { origin: 'https://meshfiredetection.org', assign },
        })
        return assign
    }

    afterEach(() => {
        Object.defineProperty(window, 'location', { configurable: true, value: realLocation })
    })

    it('offers to add Google, sending the person there and back to this page', async () => {
        const user = userEvent.setup()
        const assign = stubLocation()
        const api = stubApi({
            ...SIGNED_IN,
            'GET /v1/me/sign-in-methods': json(CODE_ONLY),
            'POST /v1/auth/link-social': json({ url: 'https://accounts.google.com/x' }),
        })
        renderAt('/account')

        expect(await screen.findByText('Emailed code')).toBeDefined()
        await user.click(await screen.findByRole('button', { name: 'Add Google' }))

        expect(assign).toHaveBeenCalledWith('https://accounts.google.com/x')
        expect(sentBodies(api, '/v1/auth/link-social')).toEqual([
            {
                provider: 'google',
                callbackURL: 'https://meshfiredetection.org/account',
                errorCallbackURL: 'https://meshfiredetection.org/account',
            },
        ])
    })

    it('says so when Google sent the person back without adding it', async () => {
        stubApi({ ...SIGNED_IN, 'GET /v1/me/sign-in-methods': json(CODE_ONLY) })
        renderAt('/account?error=not_admitted')

        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toBe(
            'Google was not added. Choose the Google account for your address.'
        )
    })

    it('removes Google, and offers only to add it again: the code cannot be removed', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            ...SIGNED_IN,
            'GET /v1/me/sign-in-methods': json(WITH_GOOGLE),
            'DELETE /v1/me/sign-in-methods/google': NO_CONTENT(),
        })
        renderAt('/account')

        await user.click(await screen.findByRole('button', { name: 'Remove Google' }))

        expect(await screen.findByRole('button', { name: 'Add Google' })).toBeDefined()
        expect(callsTo(api, 'DELETE', '/v1/me/sign-in-methods/google')).toHaveLength(1)
        expect(screen.queryByRole('button', { name: /code/iu })).toBeNull()
    })
})

describe('Account sessions', () => {
    it('lists each device, marks this browser, and ends another one', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            ...SIGNED_IN,
            'GET /v1/me/sessions': json({ sessions: [LAPTOP, PHONE] }),
            'DELETE /v1/me/sessions/s-phone': NO_CONTENT(),
        })
        renderAt('/account')

        expect(await screen.findByText('Chrome on Windows')).toBeDefined()
        expect(screen.getByText('Safari on iOS')).toBeDefined()
        expect(screen.getByText('This browser')).toBeDefined()
        // This browser leaves through the page's own Sign out, so the first is the phone's.
        const [phoneButton] = screen.getAllByRole('button', { name: 'Sign out' })
        await user.click(phoneButton!)

        await vi.waitFor(() => {
            expect(screen.queryByText('Safari on iOS')).toBeNull()
        })
        expect(callsTo(api, 'DELETE', '/v1/me/sessions/s-phone')).toHaveLength(1)
        expect(screen.getByText('Chrome on Windows')).toBeDefined()
    })

    it('signs out everywhere, then leaves for home signed out', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            ...SIGNED_IN,
            'GET /v1/me/sessions': json({ sessions: [LAPTOP, PHONE] }),
            'DELETE /v1/me/sessions': NO_CONTENT(),
        })
        renderAt('/account')

        await user.click(await screen.findByRole('button', { name: 'Sign out everywhere' }))

        const where = await screen.findByTestId('where')
        expect(where.textContent).toBe('/')
        expect(await screen.findByRole('link', { name: 'Join' })).toBeDefined()
        expect(callsTo(api, 'DELETE', '/v1/me/sessions')).toHaveLength(1)
    })

    it('names a device from its browser and system, or says it cannot', () => {
        expect(deviceName(LAPTOP.userAgent)).toBe('Chrome on Windows')
        expect(
            deviceName(
                'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/141.0 Safari/537.36 Edg/141.0'
            )
        ).toBe('Edge on Windows')
        expect(deviceName(null)).toBe('Unknown browser')
        expect(deviceName('curl/8.0')).toBe('Unknown browser')
    })
})

describe('Account deletion', () => {
    it('says what happens to nodes and readings, asks again, then deletes and leaves', async () => {
        const user = userEvent.setup()
        const api = stubApi({ ...SIGNED_IN, 'DELETE /v1/me': NO_CONTENT() })
        renderAt('/account')

        expect(await screen.findByText(/Nodes you are on stay on the network/u)).toBeDefined()
        await user.click(screen.getByRole('button', { name: 'Delete account' }))
        expect(callsTo(api, 'DELETE', '/v1/me')).toHaveLength(0)
        await user.click(screen.getByRole('button', { name: 'Delete my account' }))

        const where = await screen.findByTestId('where')
        expect(where.textContent).toBe('/')
        expect(await screen.findByRole('link', { name: 'Join' })).toBeDefined()
        expect(callsTo(api, 'DELETE', '/v1/me')).toHaveLength(1)
    })

    it('can be cancelled', async () => {
        const user = userEvent.setup()
        const api = stubApi(SIGNED_IN)
        renderAt('/account')

        await user.click(await screen.findByRole('button', { name: 'Delete account' }))
        await user.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(screen.getByRole('button', { name: 'Delete account' })).toBeDefined()
        expect(callsTo(api, 'DELETE', '/v1/me')).toHaveLength(0)
    })

    it('tells the only admin to hand over first, and stays', async () => {
        const user = userEvent.setup()
        stubApi({
            [SESSION]: json({ session: {}, user: { ...MEMBER, role: 'admin' } }),
            'DELETE /v1/me': json({ error: { code: 'conflict', message: 'only admin' } }, 409),
        })
        renderAt('/account')

        await user.click(await screen.findByRole('button', { name: 'Delete account' }))
        await user.click(screen.getByRole('button', { name: 'Delete my account' }))

        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toBe('You are the only admin. Make someone else an admin first.')
        expect(screen.queryByTestId('where')).toBeNull()
    })
})

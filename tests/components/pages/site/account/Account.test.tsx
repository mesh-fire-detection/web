// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { NavMenuProvider } from '@components/app/NavMenuProvider'
import { SessionProvider } from '@components/app/SessionProvider'
import { UnitsProvider } from '@components/app/UnitsProvider'
import { Header } from '@components/layout/Header'
import { AccountPage } from '@components/pages/site/account/Account'

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
        expect(where.textContent).toBe('/sign-in?next=/account')
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

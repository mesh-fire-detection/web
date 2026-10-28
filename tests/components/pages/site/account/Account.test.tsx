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

    it('signs out, returns home, and the header offers sign in again', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            [SESSION]: json({ session: {}, user: { ...MEMBER, role: 'admin' } }),
            'POST /v1/auth/sign-out': json({ success: true }),
        })
        renderAt('/account')

        expect(await screen.findByText('Admin')).toBeDefined()
        await user.click(screen.getByRole('button', { name: 'Sign out' }))

        const where = await screen.findByTestId('where')
        expect(where.textContent).toBe('/')
        expect(await screen.findByRole('link', { name: 'Sign in' })).toBeDefined()
        expect(sentBodies(api, '/v1/auth/sign-out')).toEqual([{}])
    })
})

describe('Header account link', () => {
    it('shows nothing until the session check answers', () => {
        stubApi({ [SESSION]: 'pending' })
        renderAt('/')

        expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull()
        expect(screen.queryByRole('link', { name: MEMBER.name })).toBeNull()
    })

    it('offers sign in to a visitor', async () => {
        stubApi({ [SESSION]: json(null) })
        renderAt('/')

        const link = await screen.findByRole('link', { name: 'Sign in' })
        expect(link.getAttribute('href')).toBe('/sign-in')
    })

    it('shows a signed-in person their name, linking to their account', async () => {
        stubApi({ [SESSION]: json({ session: {}, user: MEMBER }) })
        renderAt('/')

        const link = await screen.findByRole('link', { name: MEMBER.name })
        expect(link.getAttribute('href')).toBe('/account')
    })

    it('treats an unreachable API as signed out, so the site still works', async () => {
        stubApi({ [SESSION]: 'offline' })
        renderAt('/')

        expect(await screen.findByRole('link', { name: 'Sign in' })).toBeDefined()
    })
})

// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { SessionProvider } from '@components/app/SessionProvider'
import { UnitsProvider } from '@components/app/UnitsProvider'
import { NodesPage } from '@components/pages/nodes/Nodes'
import { SignInPage } from '@components/pages/site/account/SignIn'
import { announceNodeData } from '@core/live/signal'

import { json, MEMBER, stubApi } from '../../support/api'
import { BENCH, RIDGE } from '../pages/nodes/fixtures'

const SESSION = 'GET /v1/auth/get-session'
const UNAUTHORIZED = json({ error: { code: 'unauthorized', message: 'Sign in required' } }, 401)

afterEach(() => {
    cleanup()
})

function Where() {
    const { pathname, search } = useLocation()
    return <p aria-label='where'>{`${pathname}${search}`}</p>
}

function renderNodes() {
    render(
        <MemoryRouter initialEntries={['/nodes?mine=1']}>
            <SessionProvider>
                <UnitsProvider>
                    <Routes>
                        <Route element={<NodesPage />} path='/nodes' />
                        <Route element={<SignInPage />} path='/sign-in' />
                    </Routes>
                    <Where />
                </UnitsProvider>
            </SessionProvider>
        </MemoryRouter>
    )
}

/** Has the open page ask the server again, as its minute timer would. */
async function refresh() {
    await act(async () => {
        announceNodeData()
        await Promise.resolve()
    })
}

describe('A session that ends while a page is open', () => {
    it('signs out and sends the person to sign in, back to where they were', async () => {
        stubApi({
            [SESSION]: [json({ session: {}, user: MEMBER }), json(null)],
            'GET /v1/nodes': [json({ nodes: [RIDGE, BENCH] }), UNAUTHORIZED],
        })
        renderNodes()
        await screen.findByRole('table')

        await refresh()

        expect(
            await screen.findByText(
                'You were signed out. Sign in again to go back to where you were.'
            )
        ).toBeDefined()
        const where = new URL(screen.getByLabelText('where').textContent, 'http://site')
        expect(where.pathname).toBe('/sign-in')
        expect(where.searchParams.get('next')).toBe('/nodes?mine=1')
    })

    it('stays signed in when the API still knows the session', async () => {
        stubApi({
            [SESSION]: json({ session: {}, user: MEMBER }),
            'GET /v1/nodes': [json({ nodes: [RIDGE, BENCH] }), UNAUTHORIZED],
        })
        renderNodes()
        await screen.findByRole('table')

        await refresh()
        await act(async () => {
            await Promise.resolve()
        })

        expect(screen.getByRole('table')).toBeDefined()
        expect(screen.getByLabelText('where').textContent).toBe('/nodes?mine=1')
    })
})

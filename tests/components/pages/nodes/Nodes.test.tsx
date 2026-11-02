// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { SessionProvider } from '@components/app/SessionProvider'
import { UnitsProvider } from '@components/app/UnitsProvider'
import { NodesPage } from '@components/pages/nodes/Nodes'

import { json, MEMBER, stubApi } from '../../../support/api'

import { BENCH, GATE, RIDGE } from './fixtures'

afterEach(cleanup)

const SESSION = 'GET /v1/auth/get-session'
const SIGNED_IN = json({ session: {}, user: MEMBER })

const Where = () => {
    const { pathname, search } = useLocation()
    return <div data-testid='where'>{`${pathname}${search}`}</div>
}

function renderAt(path: string) {
    render(
        <MemoryRouter initialEntries={[path]}>
            <SessionProvider>
                <UnitsProvider>
                    <Routes>
                        <Route
                            element={
                                <>
                                    <NodesPage />
                                    <Where />
                                </>
                            }
                            path='/nodes'
                        />
                        <Route element={<Where />} path='*' />
                    </Routes>
                </UnitsProvider>
            </SessionProvider>
        </MemoryRouter>
    )
}

/** The node names in the table, top to bottom. */
async function listed(): Promise<string[]> {
    const table = await screen.findByRole('table')
    return within(table)
        .queryAllByRole('link')
        .map((link) => link.textContent)
}

describe('Nodes', () => {
    it('sends a signed-out visitor to sign in, says why, and keeps the filters for after', async () => {
        stubApi({ [SESSION]: json(null) })
        renderAt('/nodes?mine=1')

        await waitFor(() => {
            expect(screen.getByTestId('where').textContent).toBe(
                '/sign-in?next=%2Fnodes%3Fmine%3D1&why=members'
            )
        })
    })

    it('lists every node, marks yours, and shows positions as the API gives them', async () => {
        stubApi({ [SESSION]: SIGNED_IN, 'GET /v1/nodes': json({ nodes: [RIDGE, BENCH] }) })
        renderAt('/nodes')

        expect(await listed()).toEqual(['Ridge sensor', 'Bench node'])
        const table = screen.getByRole('table')
        // Approximate unless the API says otherwise; nobody named as an owner.
        expect(within(table).getByText('sen-01 · about 47.4365° N, 121.7695° W')).toBeDefined()
        expect(within(table).getByText('n-0001 · 47.4402° N, 121.7861° W')).toBeDefined()
        expect(within(table).getAllByText('Yours')).toHaveLength(1)
        expect(screen.queryByText(MEMBER.email)).toBeNull()
    })

    it('reads its filters from the URL, so a shared link shows the same view', async () => {
        stubApi({ [SESSION]: SIGNED_IN, 'GET /v1/nodes': json({ nodes: [RIDGE, BENCH, GATE] }) })
        renderAt('/nodes?status=degraded')

        expect(await listed()).toEqual(['Truck Road Gate'])
        expect(screen.getByLabelText<HTMLSelectElement>('Status').value).toBe('degraded')
    })

    it('writes each filter into the URL as it is applied', async () => {
        const user = userEvent.setup()
        stubApi({ [SESSION]: SIGNED_IN, 'GET /v1/nodes': json({ nodes: [RIDGE, BENCH, GATE] }) })
        renderAt('/nodes')
        await listed()

        await user.click(screen.getByRole('button', { name: 'Yours' }))
        expect(await listed()).toEqual(['Bench node'])
        expect(screen.getByTestId('where').textContent).toBe('/nodes?mine=1')

        await user.click(screen.getByRole('button', { name: 'All' }))
        await user.selectOptions(screen.getByLabelText('Type'), 'cellular')
        expect(await listed()).toEqual(['Truck Road Gate'])
        expect(screen.getByTestId('where').textContent).toBe('/nodes?type=cellular')

        await user.selectOptions(screen.getByLabelText('Type'), 'all')
        await user.type(screen.getByLabelText('Search nodes'), 'sen-01')
        await user.click(screen.getByRole('button', { name: 'Search' }))
        expect(await listed()).toEqual(['Ridge sensor'])
        expect(screen.getByTestId('where').textContent).toBe('/nodes?q=sen-01')
    })

    it('links to the map, focused on the nodes the filters left', async () => {
        stubApi({ [SESSION]: SIGNED_IN, 'GET /v1/nodes': json({ nodes: [BENCH, GATE, RIDGE] }) })
        renderAt('/nodes?mine=1')

        const link = await screen.findByRole('link', { name: 'View these nodes on the map' })
        expect(link.getAttribute('href')).toBe('/map?nodes=n-0001')
    })

    it('sorts by last heard, quietest first on the second press', async () => {
        const user = userEvent.setup()
        stubApi({ [SESSION]: SIGNED_IN, 'GET /v1/nodes': json({ nodes: [RIDGE, BENCH, GATE] }) })
        renderAt('/nodes')
        await listed()

        await user.click(screen.getByRole('button', { name: /Last heard/u }))
        await user.click(screen.getByRole('button', { name: /Last heard/u }))

        expect(await listed()).toEqual(['Bench node', 'Truck Road Gate', 'Ridge sensor'])
        expect(screen.getByTestId('where').textContent).toBe('/nodes?sort=heard&dir=desc')
    })

    it('says so when nothing is registered, and points at /connect', async () => {
        stubApi({ [SESSION]: SIGNED_IN, 'GET /v1/nodes': json({ nodes: [] }) })
        renderAt('/nodes')

        expect(await screen.findByText('No nodes registered yet')).toBeDefined()
        expect(screen.getByRole('link', { name: 'Connect a Node' }).getAttribute('href')).toBe(
            '/connect'
        )
    })

    it('points at /connect when none of the nodes are yours', async () => {
        stubApi({ [SESSION]: SIGNED_IN, 'GET /v1/nodes': json({ nodes: [RIDGE] }) })
        renderAt('/nodes?mine=1')

        expect(await screen.findByText('None of yours yet')).toBeDefined()
        expect(screen.getByRole('link', { name: 'Connect a Node' })).toBeDefined()
    })

    it('offers to clear filters that match nothing', async () => {
        const user = userEvent.setup()
        stubApi({ [SESSION]: SIGNED_IN, 'GET /v1/nodes': json({ nodes: [RIDGE, BENCH] }) })
        renderAt('/nodes?type=vision&q=nothing')

        expect(await screen.findByText('No nodes match these filters')).toBeDefined()
        await user.click(screen.getByRole('button', { name: 'Clear filters' }))

        expect(await listed()).toEqual(['Ridge sensor', 'Bench node'])
        expect(screen.getByTestId('where').textContent).toBe('/nodes')
        expect(screen.getByLabelText<HTMLInputElement>('Search nodes').value).toBe('')
    })

    it('offers another try when the list cannot be loaded', async () => {
        const user = userEvent.setup()
        stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes': ['offline', json({ nodes: [RIDGE] })],
        })
        renderAt('/nodes')

        await user.click(await screen.findByRole('button', { name: 'Try again' }))

        expect(await listed()).toEqual(['Ridge sensor'])
    })
})

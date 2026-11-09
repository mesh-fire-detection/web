// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { SessionProvider } from '@components/app/SessionProvider'
import { UnitsProvider } from '@components/app/UnitsProvider'
import { NodePage } from '@components/pages/nodes/NodeView'

import { json, MEMBER, sentBodies, stubApi } from '../../../support/api'

import { BENCH, GATE, minutesAgo, RIDGE } from './fixtures'

afterEach(cleanup)

const SESSION = 'GET /v1/auth/get-session'
const SIGNED_IN = json({ session: {}, user: MEMBER })
const NO_READINGS = json({ from: '', to: '', truncated: false, readings: [] })
const NO_METRICS = json({ from: '', to: '', truncated: false, metrics: [] })

const Where = () => (
    <div data-testid='where'>{`${useLocation().pathname}${useLocation().search}`}</div>
)

function renderAt(path: string) {
    render(
        <MemoryRouter initialEntries={[path]}>
            <SessionProvider>
                <UnitsProvider>
                    <Routes>
                        <Route element={<NodePage />} path='/nodes/:id' />
                        <Route element={<Where />} path='*' />
                    </Routes>
                </UnitsProvider>
            </SessionProvider>
        </MemoryRouter>
    )
}

describe('Node view', () => {
    it('sends a signed-out visitor to sign in and back', async () => {
        stubApi({ [SESSION]: json(null) })
        renderAt('/nodes/sen-01')

        const where = await screen.findByTestId('where')
        expect(where.textContent).toBe('/sign-in?next=%2Fnodes%2Fsen-01&why=members')
    })

    it('shows someone else’s node approximately, with no details and no editing', async () => {
        stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/sen-01': json({ node: RIDGE }),
            'GET /v1/nodes/sen-01/readings': NO_READINGS,
            'GET /v1/nodes/sen-01/metrics': NO_METRICS,
        })
        renderAt('/nodes/sen-01')

        // The first page this file renders: importing it can take a while under a full run.
        expect(
            await screen.findByRole(
                'heading',
                { level: 1, name: 'Ridge sensor' },
                { timeout: 10_000 }
            )
        ).toBeDefined()
        expect(screen.getByText('about 47.4365° N, 121.7695° W')).toBeDefined()
        expect(
            screen.getByText(
                'Shown to within about a kilometre. Exact positions are for the people on a node.'
            )
        ).toBeDefined()
        expect(screen.queryByRole('button', { name: 'Edit node' })).toBeNull()
        expect(screen.queryByText('Details')).toBeNull()
        expect(screen.queryByText('Yours')).toBeNull()
        expect(screen.queryByRole('heading', { name: 'Owners' })).toBeNull()
        expect(await screen.findByText('Sensor readings')).toBeDefined()
        expect(screen.queryByRole('link', { name: 'Open in Connect' })).toBeNull()
    })

    it('fills the /connect view from the server, with the latest reading and its history', async () => {
        const user = userEvent.setup()
        const temperature = 'environmentMetrics.temperature'
        const api = stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/sen-01': json({ node: RIDGE }),
            'GET /v1/nodes/sen-01/metrics': json({
                from: '',
                to: '',
                truncated: false,
                metrics: [
                    { batteryPct: 88, voltage: 4.02, uptimeS: 60, recordedAt: minutesAgo(5) },
                ],
            }),
            'GET /v1/nodes/sen-01/readings': [
                json({ from: '', to: '', truncated: true, readings: [] }),
                json({
                    from: '',
                    to: '',
                    truncated: false,
                    readings: [
                        { metric: temperature, value: 11.5, recordedAt: minutesAgo(120) },
                        { metric: temperature, value: 12.25, recordedAt: minutesAgo(5) },
                    ],
                }),
            ],
        })
        renderAt('/nodes/sen-01')

        expect(await screen.findAllByText('12.25 °C')).not.toHaveLength(0)
        expect(screen.getByText('88 %')).toBeDefined()
        expect(screen.queryByText('Signal')).toBeNull()
        await user.click(screen.getByRole('button', { name: 'Temperature' }))
        expect(screen.getByText('2 readings')).toBeDefined()
        expect(screen.getByText('From the Mesh Fire Detection server.')).toBeDefined()
        // A truncated range is missing its newest rows, so it asks for a shorter one.
        const readingCalls = api.mock.calls.filter(([url]) => url.includes('/readings'))
        expect(readingCalls).toHaveLength(2)
    })

    it('opens more details, with server telemetry and what this browser saved', async () => {
        const user = userEvent.setup()
        stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/sen-01': json({ node: RIDGE }),
            'GET /v1/nodes/sen-01/readings': NO_READINGS,
            'GET /v1/nodes/sen-01/metrics': json({
                from: '',
                to: '',
                truncated: false,
                metrics: [
                    { batteryPct: null, voltage: null, uptimeS: 60, recordedAt: minutesAgo(5) },
                ],
            }),
        })
        renderAt('/nodes/sen-01')

        await user.click(await screen.findByRole('button', { name: 'More details' }))

        expect(screen.getByText('Other reported telemetry')).toBeDefined()
        expect(screen.getByText(/60 s/u)).toBeDefined()
        expect(screen.getByText('This browser has not connected to this node.')).toBeDefined()
        expect(screen.queryByText('Connections and faults')).toBeNull()
    })

    it('shows the people on a node what browsers recorded, kept on the server', async () => {
        const user = userEvent.setup()
        stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/n-0001': json({ node: BENCH }),
            'GET /v1/nodes/n-0001/readings': NO_READINGS,
            'GET /v1/nodes/n-0001/metrics': NO_METRICS,
            'GET /v1/nodes/n-0001/events': json({
                events: [{ kind: 'restarted', at: minutesAgo(5) }],
            }),
        })
        renderAt('/nodes/n-0001')

        await user.click(await screen.findByRole('button', { name: 'More details' }))

        expect(screen.getByText('BNCH')).toBeDefined()
        expect(screen.getByText('Client')).toBeDefined()
        expect(await screen.findByText('Node restarted')).toBeDefined()
    })

    it('says what the network knows, and links to the map and to Connect', async () => {
        stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/n-0001': json({ node: BENCH }),
            'GET /v1/nodes/n-0001/readings': NO_READINGS,
            'GET /v1/nodes/n-0001/metrics': NO_METRICS,
        })
        renderAt('/nodes/n-0001')

        expect(await screen.findByText('Not in use')).toBeDefined()
        expect(screen.getByRole('link', { name: 'View on map' }).getAttribute('href')).toBe(
            '/map?nodes=n-0001'
        )
        expect(screen.getByRole('link', { name: 'Open in Connect' }).getAttribute('href')).toBe(
            '/connect'
        )
    })

    it('shows what a node does and how it connects, most recent first', async () => {
        stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/cel-01': json({ node: GATE }),
            'GET /v1/nodes/cel-01/readings': NO_READINGS,
            'GET /v1/nodes/cel-01/metrics': NO_METRICS,
        })
        renderAt('/nodes/cel-01')

        expect(await screen.findByText('Gateway, Sensor')).toBeDefined()
        expect(screen.getByText('Notecard · Cellular, 2 min ago')).toBeDefined()
        expect(screen.getByText('MQTT · Wi-Fi, not used yet')).toBeDefined()
    })

    it('works out roles from the chosen type when the backend does not send them', async () => {
        const { roles: _roles, connections: _connections, ...older } = GATE
        stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/cel-01': json({ node: older }),
            'GET /v1/nodes/cel-01/readings': NO_READINGS,
            'GET /v1/nodes/cel-01/metrics': NO_METRICS,
        })
        renderAt('/nodes/cel-01')

        expect(await screen.findByText('Gateway')).toBeDefined()
    })

    it('gives the people on a node its details and editing, and saves their changes', async () => {
        const user = userEvent.setup()
        const saved = { ...BENCH, name: 'Bench node 2', type: 'sensor' as const }
        const api = stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/n-0001': json({ node: BENCH }),
            'GET /v1/nodes/n-0001/readings': NO_READINGS,
            'GET /v1/nodes/n-0001/metrics': NO_METRICS,
            'PATCH /v1/nodes/n-0001': json({ node: saved }),
        })
        renderAt('/nodes/n-0001')

        expect(await screen.findByText('Yours')).toBeDefined()
        expect(screen.getByText('0a1b2c3d4e5f6a7b')).toBeDefined()
        expect(screen.getByText('On the shelf above the bench.')).toBeDefined()
        expect(screen.getByRole('heading', { name: 'Owners' })).toBeDefined()
        expect(screen.getByText('Grace Hopper')).toBeDefined()

        await user.click(screen.getByRole('button', { name: 'Edit node' }))
        expect(screen.queryByLabelText('Firmware')).toBeNull()
        expect(screen.getByText(/not a GPS reading from the node; anything/u)).toBeDefined()
        const name = screen.getByLabelText('Name')
        await user.clear(name)
        await user.type(name, 'Bench node 2')
        await user.selectOptions(screen.getByLabelText('Type'), 'sensor')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(await screen.findByText('Saved.')).toBeDefined()
        expect(screen.getByRole('heading', { level: 1, name: 'Bench node 2' })).toBeDefined()
        expect(sentBodies(api, '/v1/nodes/n-0001')).toEqual([
            {
                name: 'Bench node 2',
                type: 'sensor',
                position: [-121.7861, 47.4402],
                elevationM: 187,
                antennaHeightM: null,
                deployedOn: null,
                note: 'On the shelf above the bench.',
                exactPosition: false,
            },
        ])
    })

    it('names a bad field without calling the server', async () => {
        const user = userEvent.setup()
        const api = stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/n-0001': json({ node: BENCH }),
            'GET /v1/nodes/n-0001/readings': NO_READINGS,
            'GET /v1/nodes/n-0001/metrics': NO_METRICS,
        })
        renderAt('/nodes/n-0001')

        await user.click(await screen.findByRole('button', { name: 'Edit node' }))
        await user.clear(screen.getByLabelText('Latitude'))
        await user.type(screen.getByLabelText('Latitude'), '95')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(await screen.findByText('Enter a latitude between -90 and 90.')).toBeDefined()
        expect(sentBodies(api, '/v1/nodes/n-0001')).toEqual([])
    })

    it('says a node it cannot see is not found', async () => {
        stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/nodes/n-0009': json(
                { error: { code: 'not_found', message: 'Node not found' } },
                404
            ),
        })
        renderAt('/nodes/n-0009')

        expect(await screen.findByText('Node not found')).toBeDefined()
        expect(screen.getByRole('link', { name: 'All nodes' }).getAttribute('href')).toBe('/nodes')
    })
})

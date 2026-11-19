// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NavMenuProvider } from '@components/app/NavMenuProvider'
import { RadioProvider } from '@components/app/RadioProvider'
import { SessionProvider } from '@components/app/SessionProvider'
import { UnitsProvider } from '@components/app/UnitsProvider'
import { Header } from '@components/layout/Header'
import { NearbyNodesPage } from '@components/pages/build/nearby/NearbyNodes'
import { NodesPage } from '@components/pages/nodes/Nodes'
import { NodePage } from '@components/pages/nodes/NodeView'
import { chooseBluetoothDevice, knownBluetoothDevices } from '@core/nearby/transport/bluetooth'

import { json, MEMBER, stubApi } from '../../support/api'
import { mockRadio } from '../../support/nearby'
import { BENCH, RIDGE } from '../pages/nodes/fixtures'

vi.mock('@core/nearby/transport/bluetooth', () => ({
    BluetoothUnavailableError: class extends Error {},
    bluetoothSupport: vi.fn(() => 'available'),
    chooseBluetoothDevice: vi.fn(),
    knownBluetoothDevices: vi.fn(() => Promise.resolve([])),
}))

vi.mock('@core/nearby/transport/serial', () => ({
    serialSupport: vi.fn(() => 'unsupported'),
    chooseSerialDevice: vi.fn(),
    knownSerialDevices: vi.fn(() => Promise.resolve(null)),
}))

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.mocked(knownBluetoothDevices).mockResolvedValue([])
    window.localStorage.clear()
})

/** BENCH's mesh ID is `!12345678`. */
const BENCH_NUM = 0x12_34_56_78

function renderSite(path: string) {
    stubApi({
        'GET /v1/auth/get-session': json({ session: {}, user: MEMBER }),
        'GET /v1/me/nodes': json({ nodes: [] }),
        'GET /v1/nodes': json({ nodes: [RIDGE, BENCH] }),
        'GET /v1/nodes/n-0001': json({ node: BENCH }),
        'GET /v1/nodes/n-0001/readings': json({
            from: '',
            to: '',
            truncated: false,
            readings: [],
        }),
        'GET /v1/nodes/n-0001/metrics': json({
            from: '',
            to: '',
            truncated: false,
            metrics: [],
        }),
        'GET /v1/nodes/n-0001/path': 'pending',
    })
    return render(
        <StrictMode>
            <MemoryRouter initialEntries={[path]}>
                <SessionProvider>
                    <UnitsProvider>
                        <RadioProvider>
                            <NavMenuProvider>
                                <Header />
                                <Routes>
                                    <Route element={<NearbyNodesPage />} path='/connect' />
                                    <Route element={<NodesPage />} path='/nodes' />
                                    <Route element={<NodePage />} path='/nodes/:id' />
                                </Routes>
                            </NavMenuProvider>
                        </RadioProvider>
                    </UnitsProvider>
                </SessionProvider>
            </MemoryRouter>
        </StrictMode>
    )
}

describe('The radio across pages', () => {
    it('reaches for no radio on a page other than Connect', async () => {
        renderSite('/nodes')
        await screen.findByRole('table')
        expect(knownBluetoothDevices).not.toHaveBeenCalled()
        expect(screen.queryByRole('link', { name: /^Connected to/ })).toBeNull()
    })

    it('keeps a node connected after leaving Connect, and says so on Nodes and its page', async () => {
        const user = userEvent.setup()
        const radio = mockRadio(BENCH_NUM)
        vi.mocked(chooseBluetoothDevice).mockResolvedValue(radio.connection)
        const view = renderSite('/connect')
        await user.click(screen.getByRole('button', { name: 'Add Bluetooth device' }))
        await waitFor(() => {
            expect(screen.getByText('1 added · 1 connected')).toBeDefined()
        })
        // On Connect itself the page says it; the header does not repeat it.
        expect(screen.queryByRole('link', { name: /^Connected to/ })).toBeNull()
        // A registered node links to its own page.
        const page = await screen.findByRole('link', { name: 'Open node page' })
        expect(page.getAttribute('href')).toBe('/nodes/n-0001')

        await user.click(
            within(screen.getByRole('navigation', { name: 'Primary' })).getByText('Nodes')
        )
        const table = await screen.findByRole('table')
        expect(radio.connection.disconnect).not.toHaveBeenCalled()
        const chip = screen.getByRole('link', { name: /^Connected to .*Open Connect a Node$/ })
        expect(chip.getAttribute('href')).toBe('/connect')
        expect(chip.getAttribute('target')).toBeNull()
        // Only the node on this radio is marked.
        expect(within(table).getAllByText('Connected here')).toHaveLength(1)
        const benchRow = within(table).getByRole('link', { name: BENCH.name }).closest('tr')
        expect(benchRow?.textContent).toContain('Connected here')

        await user.click(within(table).getByRole('link', { name: BENCH.name }))
        await screen.findByRole('heading', { name: BENCH.name })
        expect(screen.getByText('Connected here')).toBeDefined()
        expect(screen.queryByText(/Connected from this computer before/)).toBeNull()

        await user.click(chip)
        expect(await screen.findByText('1 added · 1 connected')).toBeDefined()
        expect(radio.connection.connect).toHaveBeenCalledOnce()

        view.unmount()
        expect(radio.connection.disconnect).toHaveBeenCalledOnce()
    })
})

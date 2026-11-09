// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { SessionProvider } from '@components/app/SessionProvider'
import { GatewaysPage } from '@components/pages/nodes/Gateways'

import { json, MEMBER, stubApi } from '../../../support/api'

import { minutesAgo } from './fixtures'

afterEach(cleanup)

const SESSION = 'GET /v1/auth/get-session'
const SIGNED_IN = json({ session: {}, user: MEMBER })

function renderPage() {
    render(
        <MemoryRouter initialEntries={['/gateways']}>
            <SessionProvider>
                <GatewaysPage />
            </SessionProvider>
        </MemoryRouter>
    )
}

describe('How Data Gets In', () => {
    it('explains every path to anyone, and asks a visitor to sign in for live status', async () => {
        stubApi({ [SESSION]: json(null) })
        renderPage()

        expect(
            await screen.findByRole('link', { name: 'Sign in to see live gateway status' })
        ).toBeDefined()
        expect(screen.getByRole('heading', { name: 'Wi-Fi gateway' })).toBeDefined()
        expect(screen.getByRole('heading', { name: 'Notecard gateway' })).toBeDefined()
        expect(screen.getByRole('heading', { name: 'Your browser' })).toBeDefined()
        expect(
            screen.getByText('Sensor → LoRa mesh → Gateway → Notecard → Notehub → Server')
        ).toBeDefined()
    })

    it('shows each gateway’s paths, when it last delivered, and what was refused', async () => {
        stubApi({
            [SESSION]: SIGNED_IN,
            'GET /v1/gateways/status': json({
                broker: 'connected',
                gateways: [
                    {
                        nodeId: 'n-0005',
                        name: 'MFD Sensor 2a34',
                        enabled: true,
                        connections: [{ via: 'notecard', lastDeliveryAt: minutesAgo(2) }],
                        lastDeliveryAt: minutesAgo(2),
                        rejectedLast24h: 0,
                    },
                    {
                        nodeId: 'cel-01',
                        name: 'Truck Road Gate',
                        enabled: true,
                        connections: [
                            { via: 'mqtt', lastDeliveryAt: minutesAgo(300) },
                            { via: 'notecard', lastDeliveryAt: null },
                        ],
                        lastDeliveryAt: minutesAgo(300),
                        rejectedLast24h: 3,
                    },
                ],
            }),
        })
        renderPage()

        const table = await screen.findByRole('table')
        const [, delivering, silent] = within(table).getAllByRole('row')
        if (delivering === undefined || silent === undefined) throw new Error('two gateways')

        expect(screen.getByText('Connected')).toBeDefined()
        expect(within(delivering).getByRole('link', { name: 'MFD Sensor 2a34' })).toBeDefined()
        expect(within(delivering).getByText('Notecard: 2 min ago')).toBeDefined()
        expect(within(delivering).getByText('Delivering')).toBeDefined()
        expect(within(silent).getByText('MQTT: 5 h ago')).toBeDefined()
        expect(within(silent).getByText('Notecard: never')).toBeDefined()
        expect(within(silent).getByText('Silent')).toBeDefined()
        expect(within(silent).getByText('3')).toBeDefined()
    })
})

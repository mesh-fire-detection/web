// @vitest-environment jsdom
import { create } from '@bufbuild/protobuf'
import { Mesh, ModuleConfig, Telemetry } from '@meshtastic/protobufs'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NearbyDevicesPage } from '@components/pages/build/nearby/NearbyDevices'
import {
    bluetoothSupport,
    chooseBluetoothDevice,
    knownBluetoothDevices,
} from '@core/nearby/bluetooth'
import type { RadioConnection } from '@core/nearby/bluetooth'
import { emptyDevice } from '@core/nearby/model'
import { createDeviceMemory } from '@core/nearby/remembered'

import { linkPacket, mockRadio, radioMessage, telemetryPacket } from '../../../../support/nearby'

vi.mock('@core/nearby/bluetooth', () => ({
    bluetoothSupport: vi.fn(() => 'available'),
    chooseBluetoothDevice: vi.fn(),
    knownBluetoothDevices: vi.fn(() => Promise.resolve([])),
}))

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.mocked(bluetoothSupport).mockReturnValue('available')
    vi.mocked(knownBluetoothDevices).mockResolvedValue([])
    window.localStorage.clear()
})

function renderPage() {
    return render(
        <StrictMode>
            <MemoryRouter>
                <NearbyDevicesPage />
            </MemoryRouter>
        </StrictMode>
    )
}

describe('Nearby Devices page', () => {
    it('starts with an honest empty state and does not open the chooser on load', () => {
        renderPage()
        expect(screen.getByRole('heading', { name: 'Nearby Devices' })).toBeDefined()
        expect(screen.getByText('No devices added yet')).toBeDefined()
        expect(screen.queryByRole('heading', { name: 'Device details' })).toBeNull()
        expect(screen.queryByText(/^[\d.]+ °C$/)).toBeNull()
        expect(chooseBluetoothDevice).not.toHaveBeenCalled()
    })

    it('disables connection and provides guidance in an unsupported browser', () => {
        vi.mocked(bluetoothSupport).mockReturnValue('unsupported')
        renderPage()
        expect(
            screen.getByRole('button', { name: 'Add device' }).getAttribute('aria-disabled')
        ).toBe('true')
        fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
        expect(chooseBluetoothDevice).not.toHaveBeenCalled()
        expect(screen.getByText(/Open this page in desktop Chrome/)).toBeDefined()
    })

    it('receives actual packets, shows historical values on disconnect, and closes on unmount', async () => {
        const radio = mockRadio(123)
        vi.mocked(chooseBluetoothDevice).mockResolvedValue(radio.connection)
        const view = renderPage()
        fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
        await waitFor(() => {
            expect(screen.getByText('1 added · 1 connected')).toBeDefined()
        })
        act(() => {
            radio.send(
                telemetryPacket(123, {
                    case: 'environmentMetrics',
                    value: create(Telemetry.EnvironmentMetricsSchema, { temperature: 24.5 }),
                })
            )
        })
        expect(screen.getByText('24.5 °C')).toBeDefined()
        // Expected sensors keep their tile before any value arrives.
        expect(screen.getByRole('button', { name: 'Relative humidity' })).toBeDefined()
        fireEvent.click(screen.getByRole('button', { name: /Disconnect:/ }))
        expect(screen.getByText('Disconnected. Showing previously received data.')).toBeDefined()
        expect(screen.getByText('24.5 °C')).toBeDefined()
        fireEvent.click(screen.getByRole('button', { name: 'Previously added (1)' }))
        fireEvent.click(screen.getByRole('button', { name: /Reconnect:/ }))
        await waitFor(() => {
            expect(screen.getByText('1 added · 1 connected')).toBeDefined()
        })
        view.unmount()
        expect(radio.connection.disconnect).toHaveBeenCalledTimes(2)
    })

    it('reconnects once under StrictMode and restores no old readings', async () => {
        const radio = mockRadio(123)
        const memory = createDeviceMemory(() => window.localStorage)
        memory.write([emptyDevice(radio.connection.id, radio.connection.name)], radio.connection.id)
        vi.mocked(knownBluetoothDevices).mockResolvedValue([radio.connection])
        renderPage()
        await waitFor(() => {
            expect(screen.getByText('1 added · 1 connected')).toBeDefined()
        })
        expect(radio.connection.connect).toHaveBeenCalledOnce()
        expect(chooseBluetoothDevice).not.toHaveBeenCalled()
        expect(screen.queryByText(/^[\d.]+ °C$/)).toBeNull()
    })

    it('keeps the recent card and its details visible after reload with a neutral status and a working reconnect action', async () => {
        const radio = mockRadio(123)
        vi.mocked(chooseBluetoothDevice).mockResolvedValue(radio.connection)
        const firstPage = renderPage()
        fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
        await waitFor(() => {
            expect(screen.getByText('1 added · 1 connected')).toBeDefined()
        })
        firstPage.unmount()
        vi.mocked(knownBluetoothDevices).mockResolvedValue(null)
        renderPage()
        await waitFor(() => {
            expect(screen.getAllByText('Recently connected')).toHaveLength(1)
        })
        expect(screen.getByText('1 added · 0 connected')).toBeDefined()
        expect(screen.queryByRole('button', { name: 'Previously added (1)' })).toBeNull()
        expect(screen.getByRole('heading', { name: 'Sensor readings' })).toBeDefined()
        expect(screen.queryByText('Connected')).toBeNull()
        const card = screen.getByRole('button', { name: /Reconnect:/ }).closest('.nearby_card')
        expect(card?.classList.contains('nearby_recent')).toBe(true)
        fireEvent.keyDown(screen.getByRole('button', { name: /Reconnect:/ }), { key: 'Enter' })
        await waitFor(() => {
            expect(screen.getByText('1 added · 1 connected')).toBeDefined()
        })
        expect(screen.queryByText('Recently connected')).toBeNull()
        expect(card?.classList.contains('nearby_recent')).toBe(false)
    })

    it('shows saved-device reconnect actions without an empty details panel when getDevices is missing', async () => {
        const radio = mockRadio(123)
        const other = mockRadio(456)
        const memory = createDeviceMemory(() => window.localStorage)
        memory.write(
            [
                emptyDevice(radio.connection.id, radio.connection.name),
                emptyDevice(other.connection.id, other.connection.name),
            ],
            radio.connection.id
        )
        vi.mocked(knownBluetoothDevices).mockResolvedValue(null)
        vi.mocked(chooseBluetoothDevice).mockResolvedValue(radio.connection)
        renderPage()
        await waitFor(() => {
            expect(
                screen.getByText(/This browser requires you to select the device again/)
            ).toBeDefined()
        })
        const toggle = screen.getByRole('button', { name: 'Previously added (2)' })
        expect(toggle.getAttribute('aria-expanded')).toBe('true')
        expect(screen.getAllByRole('button', { name: /Reconnect:/ })).toHaveLength(2)
        expect(screen.queryByText('No active connection')).toBeNull()
        expect(screen.queryByText('Device details')).toBeNull()
        expect(chooseBluetoothDevice).not.toHaveBeenCalled()
        fireEvent.keyDown(toggle, { key: 'Enter' })
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
        expect(screen.queryByRole('button', { name: /Reconnect:/ })).toBeNull()
        fireEvent.keyDown(toggle, { key: 'Enter' })
        expect(toggle.getAttribute('aria-expanded')).toBe('true')
        fireEvent.keyDown(screen.getByRole('button', { name: 'Reconnect: Meshtastic_123' }), {
            key: ' ',
        })
        await waitFor(() => {
            expect(screen.getByText('2 added · 1 connected')).toBeDefined()
        })
        // The hint stays beside the device that still needs a manual reconnect.
        expect(screen.getAllByRole('button', { name: /Reconnect:/ })).toHaveLength(1)
        expect(
            screen.getByText(/This browser requires you to select the device again/)
        ).toBeDefined()
        expect(chooseBluetoothDevice).toHaveBeenCalledOnce()
    })

    it('shows the connection status once, in the device list', async () => {
        const connection: RadioConnection = {
            id: 'bluetooth-pending',
            name: 'Meshtastic_pending',
            connect: vi.fn<RadioConnection['connect']>((_request, receive) => {
                receive(
                    radioMessage({
                        case: 'myInfo',
                        value: create(Mesh.MyNodeInfoSchema, { myNodeNum: 321 }),
                    })
                )
                return Promise.resolve()
            }),
            disconnect: vi.fn(),
        }
        vi.mocked(chooseBluetoothDevice).mockResolvedValue(connection)
        renderPage()
        fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
        await waitFor(() => {
            expect(screen.getAllByText('Reading device info…')).toHaveLength(1)
        })
    })

    it('leads with battery, solar and signal, and keeps secondary details collapsed', async () => {
        const radio = mockRadio(123)
        vi.mocked(chooseBluetoothDevice).mockResolvedValue(radio.connection)
        renderPage()
        fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
        await waitFor(() => {
            expect(screen.getByText('1 added · 1 connected')).toBeDefined()
        })
        act(() => {
            radio.send(
                telemetryPacket(123, {
                    case: 'deviceMetrics',
                    value: create(Telemetry.DeviceMetricsSchema, { batteryLevel: 87 }),
                })
            )
            radio.send(linkPacket(456, { snr: 6, rssi: -90, hops: 0 }))
        })
        expect(screen.getByText('87 %')).toBeDefined()
        expect(screen.getByText('No voltage reported yet.')).toBeDefined()
        expect(screen.getByText('Good')).toBeDefined()
        expect(screen.getByText('Good · 6 dB · -90 dBm')).toBeDefined()
        expect(screen.queryByText('View details')).toBeNull()
        expect(screen.queryByText('Activity')).toBeNull()
        fireEvent.click(screen.getByRole('button', { name: 'More details' }))
        expect(screen.getByRole('heading', { name: 'Activity' })).toBeDefined()
    })

    it('shows the battery voltage direction and explains when sensor telemetry is disabled', async () => {
        const radio = mockRadio(123)
        vi.mocked(chooseBluetoothDevice).mockResolvedValue(radio.connection)
        renderPage()
        fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
        await waitFor(() => {
            expect(screen.getByText('1 added · 1 connected')).toBeDefined()
        })
        const now = Math.floor(Date.now() / 1000)
        const configuration = radioMessage({
            case: 'moduleConfig',
            value: create(ModuleConfig.ModuleConfigSchema, {
                payloadVariant: {
                    case: 'telemetry',
                    value: create(ModuleConfig.ModuleConfig_TelemetryConfigSchema, {
                        environmentMeasurementEnabled: false,
                        airQualityEnabled: false,
                    }),
                },
            }),
        })
        act(() => {
            radio.send(configuration)
            radio.send(
                telemetryPacket(
                    123,
                    {
                        case: 'deviceMetrics',
                        value: create(Telemetry.DeviceMetricsSchema, { voltage: 3.5 }),
                    },
                    now - 60
                )
            )
            radio.send(
                telemetryPacket(
                    123,
                    {
                        case: 'deviceMetrics',
                        value: create(Telemetry.DeviceMetricsSchema, { voltage: 3.55 }),
                    },
                    now
                )
            )
        })
        expect(screen.getByText('↑ +0.05 V')).toBeDefined()
        expect(screen.getByText(/3.5 V → 3.55 V over 1 min/)).toBeDefined()
        expect(screen.queryByText(/INA219/)).toBeNull()
        expect(screen.queryByText('Needs a second voltage reading to show a trend.')).toBeNull()
        expect(
            screen.getByText(
                'Connected. Environmental and particle telemetry are disabled on this node.'
            )
        ).toBeDefined()
    })
})

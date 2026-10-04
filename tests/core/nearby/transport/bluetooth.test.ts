import { afterEach, describe, expect, it, vi } from 'vitest'

import {
    BluetoothUnavailableError,
    bluetoothSupport,
    chooseBluetoothDevice,
    knownBluetoothDevices,
} from '@core/nearby/transport/bluetooth'

afterEach(() => {
    vi.unstubAllGlobals()
})

function mockBluetooth() {
    const notifications = new EventTarget()
    const reads: DataView[] = []
    const readValue = vi.fn(() =>
        Promise.resolve(reads.shift() ?? new DataView(new ArrayBuffer(0)))
    )
    const writeValueWithResponse = vi.fn(() => Promise.resolve())
    const startNotifications = vi.fn(() => {
        notifications.dispatchEvent(new Event('characteristicvaluechanged'))
        expect(readValue).not.toHaveBeenCalled()
        return Promise.resolve()
    })
    const service = {
        getCharacteristic: vi.fn((uuid: string) => {
            if (uuid.startsWith('2c55')) return Promise.resolve({ readValue })
            return uuid.startsWith('f75c')
                ? Promise.resolve({ writeValueWithResponse })
                : Promise.resolve(Object.assign(notifications, { startNotifications }))
        }),
    }
    const getPrimaryService = vi.fn(() => Promise.resolve(service))
    const disconnect = vi.fn()
    const device = Object.assign(new EventTarget(), {
        id: 'test-device',
        name: 'Meshtastic_test',
        gatt: { connect: vi.fn(() => Promise.resolve({ getPrimaryService })), disconnect },
    })
    vi.stubGlobal('isSecureContext', true)
    const requestDevice = vi.fn(() => Promise.resolve(device))
    vi.stubGlobal('navigator', { bluetooth: { requestDevice } })
    return {
        device,
        notifications,
        reads,
        readValue,
        writeValueWithResponse,
        disconnect,
        requestDevice,
    }
}

describe('Web Bluetooth transport', () => {
    it('requires both a secure context and a supported API', () => {
        vi.stubGlobal('isSecureContext', false)
        vi.stubGlobal('navigator', {})
        expect(bluetoothSupport()).toBe('insecure')
        vi.stubGlobal('isSecureContext', true)
        expect(bluetoothSupport()).toBe('unsupported')
        mockBluetooth()
        expect(bluetoothSupport()).toBe('available')
    })

    it('only reads after the initialization write, respects buffer offsets and removes listeners', async () => {
        const mock = mockBluetooth()
        const connection = await chooseBluetoothDevice()
        expect(mock.requestDevice).toHaveBeenCalledWith({
            filters: [{ services: ['6ba1b218-15a8-461f-9fa8-5dcae273eafd'] }],
        })
        const buffer = new Uint8Array([99, 1, 2, 99])
        mock.reads.push(new DataView(buffer.buffer, 1, 2))
        const receive = vi.fn()
        const lost = vi.fn()
        await connection!.connect(new Uint8Array([3]), receive, lost)
        expect(receive).toHaveBeenCalledWith(new Uint8Array([1, 2]))
        expect(mock.writeValueWithResponse).toHaveBeenCalledOnce()
        void connection!.disconnect()
        const previousReads = mock.readValue.mock.calls.length
        mock.notifications.dispatchEvent(new Event('characteristicvaluechanged'))
        mock.device.dispatchEvent(new Event('gattserverdisconnected'))
        expect(mock.readValue).toHaveBeenCalledTimes(previousReads)
        expect(mock.disconnect).toHaveBeenCalledOnce()
        expect(lost).not.toHaveBeenCalled()
    })

    it('reports unexpected disconnect once and stops subsequent notifications', async () => {
        const mock = mockBluetooth()
        const connection = await chooseBluetoothDevice()
        const lost = vi.fn()
        await connection!.connect(new Uint8Array([3]), vi.fn(), lost)
        mock.device.dispatchEvent(new Event('gattserverdisconnected'))
        mock.device.dispatchEvent(new Event('gattserverdisconnected'))
        const count = mock.readValue.mock.calls.length
        mock.notifications.dispatchEvent(new Event('characteristicvaluechanged'))
        expect(lost).toHaveBeenCalledOnce()
        expect(mock.readValue).toHaveBeenCalledTimes(count)
    })

    it('treats chooser cancellation as a canceled selection', async () => {
        const mock = mockBluetooth()
        mock.requestDevice.mockRejectedValue(
            new DOMException('No device selected', 'NotFoundError')
        )
        expect(await chooseBluetoothDevice()).toBeNull()
    })

    it('reports a missing or disabled adapter instead of a quiet cancel', async () => {
        const mock = mockBluetooth()
        mock.requestDevice.mockRejectedValue(
            new DOMException('Bluetooth adapter not available.', 'NotFoundError')
        )
        await expect(chooseBluetoothDevice()).rejects.toBeInstanceOf(BluetoothUnavailableError)
    })

    it('gets previously allowed devices without opening a chooser', async () => {
        const mock = mockBluetooth()
        const getDevices = vi.fn(() => Promise.resolve([mock.device]))
        vi.stubGlobal('navigator', {
            bluetooth: { requestDevice: mock.requestDevice, getDevices },
        })
        const known = await knownBluetoothDevices()
        expect(known?.map((device) => device.id)).toEqual(['test-device'])
        expect(getDevices).toHaveBeenCalledOnce()
        expect(mock.requestDevice).not.toHaveBeenCalled()
    })

    it('leaves manual pairing available when getDevices is unsupported', async () => {
        const mock = mockBluetooth()
        expect(await knownBluetoothDevices()).toBeNull()
        expect(bluetoothSupport()).toBe('available')
        expect(mock.requestDevice).not.toHaveBeenCalled()
    })
})

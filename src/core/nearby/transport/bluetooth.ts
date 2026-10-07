import type { Transport } from '@core/nearby/model'

export type RadioConnection = {
    readonly id: string
    readonly name: string
    readonly transport: Transport
    readonly connect: (
        request: Uint8Array<ArrayBuffer>,
        receive: (bytes: Uint8Array) => void,
        disconnected: () => void
    ) => Promise<void>
    readonly disconnect: () => void | Promise<void>
}

const SERVICE = '6ba1b218-15a8-461f-9fa8-5dcae273eafd'
const TO_RADIO = 'f75c76d2-129e-4dad-a1dd-7866124401e7'
const FROM_RADIO = '2c55e69e-4993-11ed-b878-0242ac120002'
const FROM_NUM = 'ed9da18c-a800-4f66-a670-aa7547e34453'

export function bluetoothSupport(): 'available' | 'insecure' | 'unsupported' {
    if (!globalThis.isSecureContext) return 'insecure'
    return 'bluetooth' in navigator && typeof navigator.bluetooth.requestDevice === 'function'
        ? 'available'
        : 'unsupported'
}

function deviceConnection(device: BluetoothDevice): RadioConnection {
    let release: (() => void) | undefined
    let revision = 0
    const disconnectGatt = () => {
        device.gatt?.disconnect()
    }
    const close = () => {
        release?.()
        disconnectGatt()
    }
    return {
        id: device.id,
        name: device.name ?? '',
        transport: 'bluetooth',
        async connect(request, receive, disconnected) {
            release?.()
            const attempt = ++revision
            const state = { closed: false, draining: false, pending: false, armed: false }
            const isClosed = () => state.closed || revision !== attempt
            const ensureOpen = () => {
                if (!isClosed()) return
                if (revision === attempt) disconnectGatt()
                throw new DOMException('Connection closed', 'AbortError')
            }
            const onDisconnected = () => {
                if (isClosed()) return
                state.closed = true
                release?.()
                disconnected()
            }
            device.addEventListener('gattserverdisconnected', onDisconnected)
            let notifications: BluetoothRemoteGATTCharacteristic | undefined
            let fromRadio: BluetoothRemoteGATTCharacteristic | undefined
            const drain = async () => {
                state.pending = true
                if (!fromRadio || state.draining || isClosed()) return
                state.draining = true
                try {
                    while (state.pending && !isClosed()) {
                        state.pending = false
                        let value: DataView
                        do {
                            value = await fromRadio.readValue()
                            if (isClosed()) return
                            if (value.byteLength > 0) {
                                receive(
                                    new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
                                )
                            }
                        } while (!isClosed() && value.byteLength > 0)
                    }
                } catch {
                    if (!isClosed()) {
                        onDisconnected()
                        disconnectGatt()
                    }
                } finally {
                    state.draining = false
                }
            }
            const onNotification = () => {
                state.pending = true
                if (state.armed) void drain()
            }
            release = () => {
                state.closed = true
                device.removeEventListener('gattserverdisconnected', onDisconnected)
                notifications?.removeEventListener('characteristicvaluechanged', onNotification)
                release = undefined
            }
            try {
                if (!device.gatt) throw new DOMException('No GATT server', 'NotSupportedError')
                const server = await device.gatt.connect()
                ensureOpen()
                const service = await server.getPrimaryService(SERVICE)
                ensureOpen()
                fromRadio = await service.getCharacteristic(FROM_RADIO)
                ensureOpen()
                const toRadio = await service.getCharacteristic(TO_RADIO)
                ensureOpen()
                notifications = await service.getCharacteristic(FROM_NUM)
                ensureOpen()
                notifications.addEventListener('characteristicvaluechanged', onNotification)
                await notifications.startNotifications()
                ensureOpen()
                await toRadio.writeValueWithResponse(request)
                ensureOpen()
                state.armed = true
                await drain()
            } catch (error) {
                state.closed = true
                if (revision === attempt) {
                    close()
                }
                throw error
            }
        },
        disconnect() {
            close()
        },
    }
}

/**
 * Chrome rejects the chooser with NotFoundError both when the user closes it and
 * when no Bluetooth adapter is usable (off, missing, or the browser lacks system
 * permission). Only the first is a quiet cancel.
 */
export class BluetoothUnavailableError extends Error {}

export async function chooseBluetoothDevice(): Promise<RadioConnection | null> {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE] }],
        })
        return deviceConnection(device)
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
            // Chrome says "Bluetooth adapter not available." when there is none to use.
            if (/adapter/i.test(error.message)) throw new BluetoothUnavailableError(error.message)
            return null
        }
        throw error
    }
}

export async function knownBluetoothDevices(): Promise<readonly RadioConnection[] | null> {
    if (bluetoothSupport() !== 'available' || typeof navigator.bluetooth.getDevices !== 'function')
        return null
    const devices = await navigator.bluetooth.getDevices()
    return devices.map((device) => deviceConnection(device))
}

import type { Transport } from '@core/nearby/model'
import { BAUD_RATE, serialApi, USB_VENDORS } from '@core/nearby/transport/serial'
import type { SerialPort } from '@core/nearby/transport/serial'

/*
 * The satellite receiver speaks plain text lines, not Meshtastic protobufs:
 * over USB serial, and over Bluetooth through the Nordic UART Service.
 */
const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
/** Written by the client: commands to the station. */
const NUS_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
/** Notified by the station: its output lines. */
const NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
/** The smallest ATT payload every central supports. */
const BLE_CHUNK = 20

export type ReceiverLink = {
    readonly name: string
    readonly transport: Transport
    readonly send: (command: string) => Promise<void>
    readonly disconnect: () => Promise<void>
}

type LineHandlers = {
    readonly line: (text: string) => void
    readonly closed: () => void
}

/** Feeds arbitrary byte chunks; calls `onLine` with each complete text line. */
export function createLineDecoder(onLine: (text: string) => void) {
    const decoder = new TextDecoder()
    let pending = ''
    return (chunk: Uint8Array) => {
        pending += decoder.decode(chunk, { stream: true })
        const lines = pending.split('\n')
        pending = lines.pop() ?? ''
        for (const text of lines) {
            const trimmed = text.trim()
            if (trimmed) onLine(trimmed)
        }
    }
}

const encoder = new TextEncoder()

async function openBluetooth(handlers: LineHandlers): Promise<ReceiverLink | null> {
    let device: BluetoothDevice
    try {
        device = await navigator.bluetooth.requestDevice({ filters: [{ services: [NUS_SERVICE] }] })
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
            // Chrome says "Bluetooth adapter not available." when there is none to use.
            if (/adapter/i.test(error.message)) throw error
            return null
        }
        throw error
    }
    if (!device.gatt) throw new DOMException('No GATT server', 'NotSupportedError')

    const decode = createLineDecoder(handlers.line)
    const onValue = (event: Event) => {
        const { value } = event.target as BluetoothRemoteGATTCharacteristic
        if (value) decode(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
    }
    const onDisconnected = () => {
        device.removeEventListener('gattserverdisconnected', onDisconnected)
        handlers.closed()
    }
    device.addEventListener('gattserverdisconnected', onDisconnected)

    try {
        const server = await device.gatt.connect()
        const service = await server.getPrimaryService(NUS_SERVICE)
        const rx = await service.getCharacteristic(NUS_RX)
        const tx = await service.getCharacteristic(NUS_TX)
        tx.addEventListener('characteristicvaluechanged', onValue)
        await tx.startNotifications()
        return {
            name: device.name ?? '',
            transport: 'bluetooth',
            async send(command) {
                const bytes = encoder.encode(`${command}\n`)
                for (let start = 0; start < bytes.length; start += BLE_CHUNK) {
                    await rx.writeValueWithoutResponse(bytes.slice(start, start + BLE_CHUNK))
                }
            },
            async disconnect() {
                tx.removeEventListener('characteristicvaluechanged', onValue)
                device.gatt?.disconnect()
                await Promise.resolve()
            },
        }
    } catch (error) {
        device.removeEventListener('gattserverdisconnected', onDisconnected)
        device.gatt.disconnect()
        throw error
    }
}

/** Teardown steps that fail once the device is already gone. */
async function quietly(step: () => Promise<unknown>): Promise<void> {
    try {
        await step()
    } catch {
        // An unplugged port rejects cancel and close; there is nothing left to release.
    }
}

async function openSerial(handlers: LineHandlers): Promise<ReceiverLink | null> {
    const serial = serialApi()
    if (!serial) return null
    let port: SerialPort
    try {
        port = await serial.requestPort({
            filters: USB_VENDORS.map((usbVendorId) => ({ usbVendorId })),
        })
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') return null
        throw error
    }
    await port.open({ baudRate: BAUD_RATE })
    if (!port.readable || !port.writable) {
        await port.close()
        throw new DOMException('Serial port is not readable', 'NotSupportedError')
    }
    const reader = port.readable.getReader()
    const writer = port.writable.getWriter()
    const state = { closed: false }
    const decode = createLineDecoder(handlers.line)
    const reading = (async () => {
        try {
            for (;;) {
                const { value, done } = await reader.read()
                if (done) break
                decode(value)
            }
        } catch {
            // An unplugged device ends the stream with an error.
        } finally {
            reader.releaseLock()
        }
        if (state.closed) {
            return
        }

        state.closed = true
        writer.releaseLock()
        await quietly(() => port.close())
        handlers.closed()
    })()
    return {
        name: '',
        transport: 'usb',
        async send(command) {
            if (!state.closed) await writer.write(encoder.encode(`${command}\n`))
        },
        async disconnect() {
            if (state.closed) return
            state.closed = true
            await quietly(() => reader.cancel())
            await reading
            writer.releaseLock()
            await quietly(() => port.close())
        },
    }
}

/** Resolves null when the browser's device chooser is cancelled. */
export function openReceiver(
    transport: Transport,
    handlers: LineHandlers
): Promise<ReceiverLink | null> {
    return transport === 'bluetooth' ? openBluetooth(handlers) : openSerial(handlers)
}

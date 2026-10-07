import type { RadioConnection } from '@core/nearby/transport/bluetooth'

/*
 * Meshtastic's stream API over USB serial. Each protobuf travels in a frame of
 * 0x94 0xC3, a big-endian 16-bit length and the payload. Bytes outside frames
 * are console text from the firmware and are skipped.
 */
const START1 = 0x94
const START2 = 0xc3
const HEADER_LENGTH = 4
/** The firmware's MAX_TO_FROM_RADIO_SIZE; longer lengths are noise. */
const MAX_PAYLOAD = 512
const BAUD_RATE = 115_200
/** The firmware leaves API mode after 15 minutes without client traffic. */
const HEARTBEAT_MS = 5 * 60 * 1000
/**
 * After ToRadio.disconnect the firmware leaves SERIAL, calls setBluetoothEnable(true)
 * and resumes advertising. Closing the port immediately can drop the goodbye frame;
 * this matches the Android client's polite-disconnect drain.
 */
export const SERIAL_DISCONNECT_DRAIN_MS = 500

/**
 * USB vendors of boards that run Meshtastic: Adafruit nRF52 bootloaders (RAK4631),
 * Silicon Labs CP210x, WCH CH34x, Espressif and Raspberry Pi RP2040.
 */
const USB_VENDORS = [0x23_9a, 0x10_c4, 0x1a_86, 0x30_3a, 0x2e_8a] as const

/* The subset of Web Serial this module uses; TypeScript's DOM library has none of it. */
type SerialPortInfo = { readonly usbVendorId?: number; readonly usbProductId?: number }
type SerialPort = {
    readonly readable: ReadableStream<Uint8Array> | null
    readonly writable: WritableStream<Uint8Array> | null
    open: (options: { readonly baudRate: number }) => Promise<void>
    close: () => Promise<void>
    getInfo: () => SerialPortInfo
}
type Serial = {
    requestPort: (options: {
        readonly filters: readonly { readonly usbVendorId: number }[]
    }) => Promise<SerialPort>
    getPorts: () => Promise<SerialPort[]>
}

function serialApi(): Serial | undefined {
    return (navigator as Navigator & { readonly serial?: Serial }).serial
}

export function serialSupport(): 'available' | 'insecure' | 'unsupported' {
    if (!globalThis.isSecureContext) return 'insecure'
    return typeof serialApi()?.requestPort === 'function' ? 'available' : 'unsupported'
}

export function encodeFrame(payload: Uint8Array): Uint8Array<ArrayBuffer> {
    const frame = new Uint8Array(HEADER_LENGTH + payload.length)
    frame.set([START1, START2, payload.length >> 8, payload.length & 0xff])
    frame.set(payload, HEADER_LENGTH)
    return frame
}

/** Feeds arbitrary chunks; calls `onFrame` with each complete payload. */
export function createFrameDecoder(onFrame: (payload: Uint8Array) => void) {
    let buffer = new Uint8Array(0)
    return (chunk: Uint8Array) => {
        const joined = new Uint8Array(buffer.length + chunk.length)
        joined.set(buffer)
        joined.set(chunk, buffer.length)
        let start = 0
        while (start < joined.length) {
            if (joined[start] !== START1) {
                start += 1
                continue
            }
            if (start + 1 >= joined.length) break
            if (joined[start + 1] !== START2) {
                start += 1
                continue
            }
            if (start + HEADER_LENGTH > joined.length) break
            const length = ((joined[start + 2] ?? 0) << 8) | (joined[start + 3] ?? 0)
            if (length > MAX_PAYLOAD) {
                start += 1
                continue
            }
            const end = start + HEADER_LENGTH + length
            if (end > joined.length) break
            onFrame(joined.slice(start + HEADER_LENGTH, end))
            start = end
        }
        buffer = joined.slice(start)
    }
}

/** Ports carry no stable ID; vendor, product and order among equal ports identify one. */
function portId(port: SerialPort, ports: readonly SerialPort[]): string {
    const info = port.getInfo()
    const key = (entry: SerialPortInfo) =>
        `${String(entry.usbVendorId ?? 0)}:${String(entry.usbProductId ?? 0)}`
    const twins = ports.filter((entry) => key(entry.getInfo()) === key(info))
    return `usb:${key(info)}:${String(Math.max(0, twins.indexOf(port)))}`
}

/** Teardown steps that fail once the device is already gone. */
async function quietly(step: () => Promise<unknown>): Promise<void> {
    try {
        await step()
    } catch {
        // An unplugged port rejects cancel and close; there is nothing left to release.
    }
}

/** Encoded ToRadio messages the link sends on its own; the codec stays code-split. */
export type SerialMessages = {
    readonly heartbeat: () => Uint8Array
    readonly disconnect: () => Uint8Array
}

function portConnection(port: SerialPort, id: string, messages: SerialMessages): RadioConnection {
    let closing: Promise<void> | undefined
    let release: (() => Promise<void>) | undefined
    const close = () => {
        closing = release?.() ?? closing
        return closing
    }
    return {
        id,
        name: '',
        transport: 'usb',
        async connect(request, receive, disconnected) {
            await close()
            const state = { closed: false }
            await port.open({ baudRate: BAUD_RATE })
            if (!port.readable || !port.writable) {
                await port.close()
                throw new DOMException('Serial port is not readable', 'NotSupportedError')
            }
            const reader = port.readable.getReader()
            const writer = port.writable.getWriter()
            let timer: ReturnType<typeof setInterval> | undefined
            let reading = Promise.resolve()
            release = async () => {
                if (state.closed) return
                state.closed = true
                release = undefined
                clearInterval(timer)
                // The firmware turns Bluetooth advertising off for a serial client and
                // cannot see the port close. ToRadio.disconnect leaves SERIAL and calls
                // setBluetoothEnable(true); wait so the frame is not dropped on close.
                await quietly(() => writer.write(encodeFrame(messages.disconnect())))
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, SERIAL_DISCONNECT_DRAIN_MS)
                })
                await quietly(() => reader.cancel())
                await reading
                writer.releaseLock()
                await quietly(() => port.close())
            }
            const decode = createFrameDecoder(receive)
            reading = (async () => {
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
                if (state.closed) return
                void close()
                disconnected()
            })()
            try {
                // A burst of START2 bytes moves a console session into protobuf mode.
                await writer.write(new Uint8Array(32).fill(START2))
                await writer.write(encodeFrame(request))
                timer = setInterval(() => {
                    void quietly(() => writer.write(encodeFrame(messages.heartbeat())))
                }, HEARTBEAT_MS)
            } catch (error) {
                void close()
                throw error
            }
        },
        disconnect() {
            return close()
        },
    }
}

export async function chooseSerialDevice(
    messages: SerialMessages
): Promise<RadioConnection | null> {
    const serial = serialApi()
    if (!serial) return null
    try {
        const port = await serial.requestPort({
            filters: USB_VENDORS.map((usbVendorId) => ({ usbVendorId })),
        })
        return portConnection(port, portId(port, await serial.getPorts()), messages)
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') return null
        throw error
    }
}

/** Codecs the DFU request needs, passed in so the protobuf codec stays code-split. */
export type DfuMessages = {
    readonly configuration: () => Uint8Array
    readonly localNodeNum: (payload: Uint8Array) => number | null
    readonly dfu: (myNodeNum: number) => Uint8Array
}

/** The node reports its identity within a second or two of the configuration request. */
const IDENTITY_TIMEOUT_MS = 10_000

/**
 * Lets the builder choose a node and reboots it into its UF2 bootloader, which
 * mounts as a USB drive. Resolves false when the chooser is cancelled; rejects
 * with a `TimeoutError` when the node never reports its identity.
 */
export async function rebootSerialToDfu(
    loadMessages: () => Promise<DfuMessages>
): Promise<boolean> {
    const serial = serialApi()
    if (!serial) return false
    let port: SerialPort
    try {
        port = await serial.requestPort({
            filters: USB_VENDORS.map((usbVendorId) => ({ usbVendorId })),
        })
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') return false
        throw error
    }
    const messages = await loadMessages()
    await port.open({ baudRate: BAUD_RATE })
    if (!port.readable || !port.writable) {
        await port.close()
        throw new DOMException('Serial port is not readable', 'NotSupportedError')
    }
    const reader = port.readable.getReader()
    const writer = port.writable.getWriter()
    try {
        await writer.write(new Uint8Array(32).fill(START2))
        await writer.write(encodeFrame(messages.configuration()))
        const myNodeNum = await new Promise<number>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new DOMException('The node did not report its identity', 'TimeoutError'))
            }, IDENTITY_TIMEOUT_MS)
            const decode = createFrameDecoder((payload) => {
                const num = messages.localNodeNum(payload)
                if (num === null) return
                clearTimeout(timer)
                resolve(num)
            })
            void (async () => {
                try {
                    for (;;) {
                        const { value, done } = await reader.read()
                        if (done) break
                        decode(value)
                    }
                } catch {
                    // Cancelling the reader below ends this loop.
                }
            })()
        })
        await writer.write(encodeFrame(messages.dfu(myNodeNum)))
        return true
    } finally {
        // The node reboots and drops off USB, so every step here may fail.
        await quietly(() => reader.cancel())
        reader.releaseLock()
        writer.releaseLock()
        await quietly(() => port.close())
    }
}

export async function knownSerialDevices(
    messages: SerialMessages
): Promise<readonly RadioConnection[] | null> {
    const serial = serialApi()
    if (!serial || serialSupport() !== 'available') return null
    const ports = await serial.getPorts()
    return ports.map((port) => portConnection(port, portId(port, ports), messages))
}

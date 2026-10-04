import { afterEach, describe, expect, it, vi } from 'vitest'

import {
    chooseSerialDevice,
    createFrameDecoder,
    encodeFrame,
    rebootSerialToDfu,
    SERIAL_DISCONNECT_DRAIN_MS,
} from '@core/nearby/transport/serial'

describe('Meshtastic serial framing', () => {
    it('frames a payload with the magic bytes and a big-endian length', () => {
        const payload = new Uint8Array(300).fill(7)
        const frame = encodeFrame(payload)
        expect([...frame.slice(0, 4)]).toEqual([0x94, 0xc3, 0x01, 0x2c])
        expect(frame.length).toBe(304)
    })

    it('skips console text and reassembles frames split across chunks', () => {
        const frames: number[][] = []
        const decode = createFrameDecoder((payload) => {
            frames.push([...payload])
        })
        const first = encodeFrame(new Uint8Array([1, 2, 3]))
        const second = encodeFrame(new Uint8Array([4, 5]))
        const log = new TextEncoder().encode('INFO | boot\r\n')
        const stream = new Uint8Array([...log, ...first, ...second])
        decode(stream.slice(0, log.length + 2))
        decode(stream.slice(log.length + 2, log.length + 6))
        decode(stream.slice(log.length + 6))
        expect(frames).toEqual([
            [1, 2, 3],
            [4, 5],
        ])
    })

    it('treats an oversized length as noise and resynchronises', () => {
        const frames: number[][] = []
        const decode = createFrameDecoder((payload) => {
            frames.push([...payload])
        })
        const valid = encodeFrame(new Uint8Array([9]))
        decode(new Uint8Array([0x94, 0xc3, 0xff, 0xff, ...valid]))
        expect(frames).toEqual([[9]])
    })

    it('accepts an empty payload, which is a valid protobuf', () => {
        const frames: number[][] = []
        const decode = createFrameDecoder((payload) => {
            frames.push([...payload])
        })
        decode(encodeFrame(new Uint8Array(0)))
        expect(frames).toEqual([[]])
    })
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('Meshtastic serial connection', () => {
    function fakePort() {
        const written: number[][] = []
        let pushFrame: (chunk: Uint8Array) => void = () => {}
        const port = {
            readable: new ReadableStream<Uint8Array>({
                start(controller) {
                    pushFrame = (chunk) => {
                        controller.enqueue(chunk)
                    }
                },
            }),
            writable: new WritableStream<Uint8Array>({
                write(chunk) {
                    written.push([...chunk])
                },
            }),
            open: vi.fn(() => Promise.resolve()),
            close: vi.fn(() => Promise.resolve()),
            getInfo: () => ({ usbVendorId: 0x23_9a, usbProductId: 0x80_29 }),
        }
        return {
            port,
            written,
            push: (chunk: Uint8Array) => {
                pushFrame(chunk)
            },
        }
    }

    it('says goodbye and waits so the firmware can resume Bluetooth advertising', async () => {
        const fake = fakePort()
        vi.stubGlobal('isSecureContext', true)
        vi.stubGlobal('navigator', {
            serial: {
                requestPort: () => Promise.resolve(fake.port),
                getPorts: () => Promise.resolve([fake.port]),
            },
        })
        const messages = {
            heartbeat: () => new Uint8Array([0x01]),
            disconnect: () => new Uint8Array([0x02]),
        }
        const connection = await chooseSerialDevice(messages)
        const received: number[][] = []
        await connection?.connect(
            new Uint8Array([0x09]),
            (bytes) => {
                received.push([...bytes])
            },
            () => {}
        )
        fake.push(encodeFrame(new Uint8Array([7, 7])))
        await vi.waitFor(() => {
            expect(received).toEqual([[7, 7]])
        })
        vi.useFakeTimers()
        const closing = connection?.disconnect()
        await vi.advanceTimersByTimeAsync(SERIAL_DISCONNECT_DRAIN_MS - 1)
        expect(fake.port.close).not.toHaveBeenCalled()
        expect(fake.written.at(-1)).toEqual([...encodeFrame(new Uint8Array([0x02]))])
        await vi.advanceTimersByTimeAsync(1)
        await closing
        expect(fake.port.close).toHaveBeenCalledOnce()
        expect(connection?.id).toBe('usb:9114:32809:0')
        expect(fake.written.at(-2)).toEqual([...encodeFrame(new Uint8Array([0x09]))])
    })

    it('sends the DFU request to the node that reported its identity, then closes', async () => {
        const fake = fakePort()
        vi.stubGlobal('navigator', {
            serial: {
                requestPort: () => Promise.resolve(fake.port),
                getPorts: () => Promise.resolve([fake.port]),
            },
        })
        const rebooting = rebootSerialToDfu(() =>
            Promise.resolve({
                configuration: () => new Uint8Array([0x09]),
                localNodeNum: (payload) => (payload[0] === 0x42 ? 1234 : null),
                dfu: (num) => new Uint8Array([num & 0xff]),
            })
        )
        await vi.waitFor(() => {
            expect(fake.written.at(-1)).toEqual([...encodeFrame(new Uint8Array([0x09]))])
        })
        fake.push(encodeFrame(new Uint8Array([0x01])))
        fake.push(encodeFrame(new Uint8Array([0x42])))
        await expect(rebooting).resolves.toBe(true)
        expect(fake.written.at(-1)).toEqual([...encodeFrame(new Uint8Array([1234 & 0xff]))])
        expect(fake.port.close).toHaveBeenCalledOnce()
        vi.unstubAllGlobals()
    })

    it('treats a cancelled chooser as no change', async () => {
        vi.stubGlobal('navigator', {
            serial: {
                requestPort: () => Promise.reject(new DOMException('', 'NotFoundError')),
                getPorts: () => Promise.resolve([]),
            },
        })
        await expect(
            rebootSerialToDfu(() =>
                Promise.resolve({
                    configuration: () => new Uint8Array(0),
                    localNodeNum: () => null,
                    dfu: () => new Uint8Array(0),
                })
            )
        ).resolves.toBe(false)
        vi.unstubAllGlobals()
    })
})

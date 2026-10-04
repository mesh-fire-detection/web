import { describe, expect, it, vi } from 'vitest'

import { emptyDevice } from '@core/nearby/model'
import { createDeviceMemory } from '@core/nearby/storage/devices'

describe('remembered nearby devices', () => {
    it('persists identity and latest readings, but not configuration or history, and avoids repeated writes', () => {
        let serialized = ''
        const storage = {
            getItem: () => serialized,
            setItem: vi.fn((_key: string, value: string) => {
                serialized = value
            }),
        }
        const memory = createDeviceMemory(() => storage)
        const device = {
            ...emptyDevice('radio', 'Bluetooth name'),
            name: 'Sensor node',
            nodeNum: 123,
            shortName: 'SN',
            hardware: 'RAK4631',
            firmware: '2.6.11.mfd',
            configuration: { secret: 'private-key' },
            history: { 'deviceMetrics.voltage': [{ value: 3.8, at: 1000 }] },
            readings: {
                temperature: {
                    metric: 'temperature',
                    value: 24,
                    sender: 123,
                    receivedAt: 1000,
                    measuredAt: null,
                    cached: false,
                },
            },
        }
        memory.write([device], 'radio')
        memory.write([{ ...device, state: 'connected' }], 'radio')
        expect(storage.setItem).toHaveBeenCalledOnce()
        expect(JSON.parse(serialized)).toEqual({
            version: 1,
            devices: [
                {
                    id: 'radio',
                    bluetoothName: 'Bluetooth name',
                    name: 'Sensor node',
                    nodeNum: 123,
                    shortName: 'SN',
                    hardware: 'RAK4631',
                    firmware: '2.6.11.mfd',
                    connectedAt: null,
                    transport: 'bluetooth',
                    readings: [device.readings.temperature],
                },
            ],
            activeId: 'radio',
        })
        expect(memory.read().activeId).toBe('radio')
        expect(memory.read().devices[0]?.readings).toEqual([device.readings.temperature])
        expect(memory.read().devices[0]).toMatchObject({
            shortName: 'SN',
            hardware: 'RAK4631',
            firmware: '2.6.11.mfd',
        })
    })

    it('ignores identity details of the wrong type', () => {
        const serialized = JSON.stringify({
            version: 1,
            devices: [{ id: 'radio', bluetoothName: '', name: '', nodeNum: null, hardware: 4631 }],
            activeId: null,
        })
        const memory = createDeviceMemory(() => ({ getItem: () => serialized, setItem: vi.fn() }))
        expect(memory.read().devices).toEqual([])
    })

    it.each([
        'invalid-json',
        JSON.stringify({ version: 2, devices: [], activeId: null }),
        JSON.stringify({ version: 1, devices: [{ id: 'radio' }], activeId: null }),
        JSON.stringify({
            version: 1,
            devices: [{ id: 'radio', bluetoothName: '', name: '', nodeNum: -1 }],
            activeId: null,
        }),
    ])('ignores invalid stored data: %s', (serialized) => {
        const memory = createDeviceMemory(() => ({ getItem: () => serialized, setItem: vi.fn() }))
        expect(memory.read()).toEqual({ version: 1, devices: [], activeId: null })
    })

    it('drops duplicate IDs, unknown fields and an active ID outside the saved list', () => {
        const device = { id: 'radio', bluetoothName: '', name: '', nodeNum: null, secret: 'key' }
        const memory = createDeviceMemory(() => ({
            getItem: () =>
                JSON.stringify({ version: 1, devices: [device, device], activeId: 'other' }),
            setItem: vi.fn(),
        }))
        expect(memory.read()).toEqual({
            version: 1,
            devices: [{ id: 'radio', bluetoothName: '', name: '', nodeNum: null }],
            activeId: null,
        })
    })

    it('tolerates blocked browser storage', () => {
        const memory = createDeviceMemory(() => {
            throw new DOMException('Storage blocked', 'SecurityError')
        })
        expect(memory.read().devices).toEqual([])
        expect(() => {
            memory.write([emptyDevice('radio', '')], 'radio')
        }).not.toThrow()
    })

    it('reads battery voltage saved before histories covered every metric', () => {
        const saved = JSON.stringify({
            version: 1,
            devices: [
                {
                    id: 'radio',
                    bluetoothName: '',
                    name: '',
                    nodeNum: 123,
                    voltageHistory: [{ value: 3.8, at: 1000 }],
                },
            ],
            activeId: null,
        })
        const memory = createDeviceMemory(() => ({ getItem: () => saved, setItem: vi.fn() }))
        expect(memory.read().devices[0]?.history).toEqual({
            'deviceMetrics.voltage': [{ value: 3.8, at: 1000 }],
        })
    })

    it('restores legacy sensor history containing zero and negative values', () => {
        const history = {
            temperature: [
                { value: -5, at: 1000 },
                { value: 0, at: 2000 },
            ],
        }
        const memory = createDeviceMemory(() => ({
            getItem: () =>
                JSON.stringify({
                    version: 1,
                    devices: [{ id: 'radio', bluetoothName: '', name: '', nodeNum: 123, history }],
                    activeId: null,
                }),
            setItem: vi.fn(),
        }))
        expect(memory.read().devices[0]?.history).toEqual(history)
    })
})

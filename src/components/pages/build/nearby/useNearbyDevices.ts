import { useEffect, useState, useSyncExternalStore } from 'react'

import type { Transport } from '@core/nearby/model'
import { createNearbySession } from '@core/nearby/session'
import { createDeviceMemory } from '@core/nearby/storage/devices'
import { createReadingStore } from '@core/nearby/storage/readings'
import {
    bluetoothSupport,
    chooseBluetoothDevice,
    knownBluetoothDevices,
} from '@core/nearby/transport/bluetooth'
import type { RadioConnection } from '@core/nearby/transport/bluetooth'
import {
    chooseSerialDevice,
    knownSerialDevices,
    serialSupport,
} from '@core/nearby/transport/serial'
import type { SerialMessages } from '@core/nearby/transport/serial'

/** The codec stays code-split; the serial link only needs it for its own messages. */
async function serialMessages(): Promise<SerialMessages> {
    const { disconnectRequest, heartbeatRequest } = await import('@core/nearby/protocol')
    return { heartbeat: heartbeatRequest, disconnect: disconnectRequest }
}

async function choose(transport: Transport): Promise<RadioConnection | null> {
    return transport === 'usb'
        ? chooseSerialDevice(await serialMessages())
        : chooseBluetoothDevice()
}

async function knownBluetooth(): Promise<readonly RadioConnection[] | null> {
    try {
        return await knownBluetoothDevices()
    } catch {
        return null
    }
}

async function knownUsb(): Promise<readonly RadioConnection[] | null> {
    return serialSupport() === 'available' ? knownSerialDevices(await serialMessages()) : null
}

/** Previously allowed devices of both kinds; null only when neither browser API can list them. */
async function known(): Promise<readonly RadioConnection[] | null> {
    const [bluetooth, usb] = await Promise.all([knownBluetooth(), knownUsb()])
    return bluetooth === null && usb === null ? null : [...(bluetooth ?? []), ...(usb ?? [])]
}

export function useNearbyDevices() {
    const [session] = useState(() =>
        createNearbySession(choose, {
            memory: createDeviceMemory(() => window.localStorage),
            readings: createReadingStore(() => window.indexedDB),
            known,
        })
    )
    const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
    const [support] = useState(() => ({ bluetooth: bluetoothSupport(), usb: serialSupport() }))

    useEffect(() => {
        session.activate()
        void session.prepare()
        void session.restore()
        return () => {
            session.dispose()
        }
    }, [session])

    return { session, snapshot, support }
}

import { useEffect, useState, useSyncExternalStore } from 'react'

import {
    bluetoothSupport,
    chooseBluetoothDevice,
    knownBluetoothDevices,
} from '@core/nearby/bluetooth'
import { createDeviceMemory } from '@core/nearby/remembered'
import { createNearbySession } from '@core/nearby/session'

export function useNearbyDevices() {
    const [session] = useState(() =>
        createNearbySession(chooseBluetoothDevice, {
            memory: createDeviceMemory(() => window.localStorage),
            known: knownBluetoothDevices,
        })
    )
    const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
    const [support] = useState(bluetoothSupport)

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

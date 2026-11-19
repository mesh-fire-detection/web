import {
    createContext,
    useContext,
    useEffect,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from 'react'

import type { Snapshot, Transport } from '@core/nearby/model'
import { createRadio, type Radio, type RadioState } from '@core/nearby/radio'
import { createNearbySession } from '@core/nearby/session'
import { createNodeMemory } from '@core/nearby/storage/nodes'
import { createReadingStore } from '@core/nearby/storage/readings'
import { chooseBluetoothDevice, knownBluetoothDevices } from '@core/nearby/transport/bluetooth'
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

/** Previously allowed nodes of both kinds; null only when neither browser API can list them. */
async function known(): Promise<readonly RadioConnection[] | null> {
    const [bluetooth, usb] = await Promise.all([knownBluetooth(), knownUsb()])
    return bluetooth === null && usb === null ? null : [...(bluetooth ?? []), ...(usb ?? [])]
}

function createConnectSession() {
    return createNearbySession(choose, {
        memory: createNodeMemory(() => window.localStorage),
        readings: createReadingStore(() => window.indexedDB),
        known,
    })
}

const RadioContext = createContext<Radio | null>(null)

/**
 * The radio session for every page, so leaving `/connect` keeps the node
 * connected. It closes when the site does: on unmount, or when the tab goes.
 */
export function RadioProvider({ children }: { readonly children: ReactNode }) {
    const [radio] = useState(() => createRadio(createConnectSession))

    useEffect(() => {
        const close = () => {
            radio.dispose()
        }
        window.addEventListener('pagehide', close)
        return () => {
            window.removeEventListener('pagehide', close)
            radio.dispose()
        }
    }, [radio])

    return <RadioContext.Provider value={radio}>{children}</RadioContext.Provider>
}

/** For `/connect`: the session, started on first use and kept for the rest of the visit. */
export function useRadioSession(): RadioState {
    const radio = useContext(RadioContext)
    if (radio === null) throw new Error('useRadioSession must be used within RadioProvider')
    radio.ensure()
    const state = useSyncExternalStore(radio.subscribe, radio.getState)
    useEffect(() => {
        radio.wake()
    }, [radio, state])
    // `ensure` above made one, and only dispose takes it away, which `wake` undoes.
    return state ?? radio.ensure()
}

const unsubscribe = () => {
    // Nothing was subscribed.
}
const noSubscription = () => unsubscribe
const nothing = () => null

/** What the radio holds, for any page; null until `/connect` has started it in this tab. */
export function useRadioSnapshot(): Snapshot | null {
    const radio = useContext(RadioContext)
    const state = useSyncExternalStore(
        radio?.subscribe ?? noSubscription,
        radio?.getState ?? nothing
    )
    return state?.snapshot ?? null
}

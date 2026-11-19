import { useState } from 'react'

import { useRadioSession } from '@components/app/RadioProvider'
import { bluetoothSupport } from '@core/nearby/transport/bluetooth'
import { serialSupport } from '@core/nearby/transport/serial'

/** `/connect`'s view of the site-wide radio session, and what this browser supports. */
export function useNearbyNodes() {
    const { session, snapshot } = useRadioSession()
    const [support] = useState(() => ({ bluetooth: bluetoothSupport(), usb: serialSupport() }))
    return { session, snapshot, support }
}

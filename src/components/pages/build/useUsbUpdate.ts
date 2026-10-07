import { useState } from 'react'

import { firmwareContent } from '@core/content/build/firmware'
import type { DfuState } from '@core/nearby/firmware'
import { rebootSerialToDfu, serialSupport } from '@core/nearby/transport/serial'
import { drivePickerSupport, fetchUf2, pickUf2Drive, writeUf2ToDrive } from '@core/nearby/uf2'

/** An open port rejects with InvalidStateError; a silent node with our TimeoutError. */
const FAILURES: Readonly<Record<string, DfuState>> = {
    InvalidStateError: 'busy',
    TimeoutError: 'timeout',
    DataError: 'wrongDrive',
}

function failure(error: unknown): DfuState {
    return (error instanceof DOMException ? FAILURES[error.name] : undefined) ?? 'failed'
}

const BUSY: ReadonlySet<DfuState> = new Set(['rebooting', 'selecting', 'fetching', 'writing'])

/** Reboots a RAK10722 into its UF2 bootloader, then writes the build onto that drive. */
export function useUsbUpdate() {
    const [state, setState] = useState<DfuState>('idle')
    const [support] = useState(serialSupport)
    const [canWrite] = useState(drivePickerSupport)

    const enterUpdateMode = async () => {
        setState('rebooting')
        try {
            const chosen = await rebootSerialToDfu(async () => {
                const { configurationRequest, dfuRequest, localNodeNum } =
                    await import('@core/nearby/protocol')
                return {
                    configuration: () =>
                        configurationRequest(Math.floor(Math.random() * 0xff_ff_ff)),
                    localNodeNum,
                    dfu: dfuRequest,
                }
            })
            setState(chosen ? 'bootloader' : 'idle')
        } catch (error) {
            setState(failure(error))
        }
    }

    const flashFirmware = async () => {
        const previous = state
        let selected = false
        setState('selecting')
        try {
            // The picker must run during the click's transient user activation.
            const directory = await pickUf2Drive()
            selected = true
            setState('fetching')
            const bytes = await fetchUf2(firmwareContent.usb.uf2Href, firmwareContent.usb.uf2Sha256)
            setState('writing')
            await writeUf2ToDrive(bytes, firmwareContent.usb.uf2Name, directory)
            setState('done')
        } catch (error) {
            setState(
                !selected && error instanceof DOMException && error.name === 'AbortError'
                    ? previous
                    : failure(error)
            )
        }
    }

    return { state, support, canWrite, busy: BUSY.has(state), enterUpdateMode, flashFirmware }
}

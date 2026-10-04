// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { UsbUpdate } from '@components/pages/build/UsbUpdate'
import { drivePickerSupport, fetchUf2, pickUf2Drive, writeUf2ToDrive } from '@core/nearby/uf2'
import type { Uf2DirectoryHandle } from '@core/nearby/uf2'

vi.mock('@core/nearby/transport/serial', () => ({
    serialSupport: () => 'available',
    rebootSerialToDfu: vi.fn(),
}))
vi.mock('@core/nearby/uf2', () => ({
    drivePickerSupport: vi.fn(() => true),
    fetchUf2: vi.fn(),
    pickUf2Drive: vi.fn(),
    writeUf2ToDrive: vi.fn(),
}))

const directory: Uf2DirectoryHandle = {
    getFileHandle: () => Promise.reject(new Error('Handled by mocked writeUf2ToDrive')),
}

afterEach(() => {
    cleanup()
    vi.resetAllMocks()
    vi.mocked(drivePickerSupport).mockReturnValue(true)
})

describe('USB update actions', () => {
    it('opens the picker before fetching and asks for a version check after copying', async () => {
        const selection = Promise.withResolvers<Uf2DirectoryHandle>()
        vi.mocked(pickUf2Drive).mockReturnValue(selection.promise)
        vi.mocked(fetchUf2).mockResolvedValue(new Uint8Array([1]))
        vi.mocked(writeUf2ToDrive).mockResolvedValue(undefined)
        render(<UsbUpdate />)
        fireEvent.click(screen.getByRole('button', { name: 'Flash firmware' }))
        expect(pickUf2Drive).toHaveBeenCalledOnce()
        expect(fetchUf2).not.toHaveBeenCalled()
        expect(
            screen.getByRole('button', { name: 'Flash firmware' }).getAttribute('aria-disabled')
        ).toBe('true')
        selection.resolve(directory)
        expect(
            await within(screen.getByRole('status')).findByText(
                'Firmware copied. Reconnect the node to confirm its build.'
            )
        ).toBeDefined()
        expect(writeUf2ToDrive).toHaveBeenCalledWith(
            new Uint8Array([1]),
            expect.any(String),
            directory
        )
    })

    it('leaves an idle page unchanged when the drive chooser is canceled', async () => {
        vi.mocked(pickUf2Drive).mockRejectedValue(new DOMException('Canceled', 'AbortError'))
        render(<UsbUpdate />)
        fireEvent.click(screen.getByRole('button', { name: 'Flash firmware' }))
        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Flash firmware' }).getAttribute('aria-disabled')
            ).not.toBe('true')
        })
        expect(fetchUf2).not.toHaveBeenCalled()
        expect(screen.getByRole('status').textContent).toBe('')
    })

    it('shows a failed write when the drive unmounts instead of reporting success', async () => {
        vi.mocked(pickUf2Drive).mockResolvedValue(directory)
        vi.mocked(fetchUf2).mockResolvedValue(new Uint8Array([1]))
        vi.mocked(writeUf2ToDrive).mockRejectedValue(new DOMException('Unmounted', 'AbortError'))
        render(<UsbUpdate />)
        fireEvent.click(screen.getByRole('button', { name: 'Flash firmware' }))
        const status = within(screen.getByRole('status'))
        expect(await status.findByText(/Update could not be confirmed/)).toBeDefined()
        expect(status.queryByText(/Firmware copied/)).toBeNull()
    })

    it('explains missing drive-picker support without attempting a write', () => {
        vi.mocked(drivePickerSupport).mockReturnValue(false)
        render(<UsbUpdate />)
        expect(screen.getByText(/This browser cannot complete USB flashing here/)).toBeDefined()
        fireEvent.click(screen.getByRole('button', { name: 'Flash firmware' }))
        expect(pickUf2Drive).not.toHaveBeenCalled()
    })
})

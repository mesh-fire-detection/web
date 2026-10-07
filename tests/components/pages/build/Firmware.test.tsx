// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { FirmwareUpdate } from '@components/build/FirmwareUpdate'
import { FirmwarePage } from '@components/pages/build/Firmware'
import { MFD_BUILD } from '@core/nearby/firmware'

afterEach(cleanup)

describe('Firmware page', () => {
    it('offers USB flashing here and only the official external flasher', () => {
        render(
            <MemoryRouter>
                <FirmwarePage />
            </MemoryRouter>
        )
        expect(screen.getByRole('heading', { name: 'Firmware' })).toBeDefined()
        expect(screen.getByRole('link', { name: 'Connect a Node' }).getAttribute('href')).toBe(
            '/connect'
        )
        expect(
            screen.getByRole('link', { name: 'Official Meshtastic Flasher' }).getAttribute('href')
        ).toBe('https://flasher.meshtastic.org')
        expect(
            screen.getByRole('link', { name: 'MFD firmware on GitHub' }).getAttribute('href')
        ).toBe('https://github.com/mesh-fire-detection/firmware')
        expect(screen.getByRole('button', { name: 'Enter update mode' })).toBeDefined()
        expect(screen.getByRole('button', { name: 'Flash firmware' })).toBeDefined()
        expect(screen.queryByRole('link', { name: /MFD Flasher/ })).toBeNull()
        expect(screen.queryByRole('link', { name: 'Firmware zip' })).toBeNull()
        expect(screen.queryByRole('link', { name: /Compare the fork/ })).toBeNull()
    })

    it('keeps the node update guide short and directs flashing to /firmware', () => {
        render(
            <MemoryRouter>
                <FirmwareUpdate firmware={MFD_BUILD} />
            </MemoryRouter>
        )
        expect(screen.getByText('Up to date')).toBeDefined()
        expect(screen.getByRole('link', { name: 'Open Firmware' }).getAttribute('href')).toBe(
            '/firmware'
        )
        expect(screen.getAllByText(/^(01|02|03)$/)).toHaveLength(3)
        expect(screen.getByText(/Updating keeps settings; do not factory erase/)).toBeDefined()
        expect(screen.queryByRole('link', { name: /Flasher/ })).toBeNull()
    })
})

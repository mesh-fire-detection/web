// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { UnitsProvider } from '@components/app/UnitsProvider'
import { DesignPage } from '@components/pages/site/design/Design'

describe('UI kit page', () => {
    it('renders every part of the kit', () => {
        render(
            <MemoryRouter initialEntries={['/design']}>
                <UnitsProvider>
                    <DesignPage />
                </UnitsProvider>
            </MemoryRouter>
        )

        for (const title of [
            'Foundations',
            'Typography',
            'Layout and surfaces',
            'Actions and navigation',
            'Fields',
            'Status and feedback',
            'Data and content',
            'Icons',
            'Site chrome',
        ]) {
            expect(screen.getByRole('heading', { name: title })).toBeTruthy()
        }
        expect(screen.getByRole('link', { name: 'Connected to Ridge 3' })).toBeTruthy()
        expect(screen.getAllByRole('table').length).toBeGreaterThanOrEqual(4)
    })
})

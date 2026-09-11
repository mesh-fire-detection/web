// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { NavHit } from '@components/shared/navigation/NavHit'

const LocationProbe = () => {
    const location = useLocation()
    return <div data-testid='path'>{location.pathname}</div>
}

describe('NavHit', () => {
    it('renders a real anchor with the target href', () => {
        render(
            <MemoryRouter>
                <NavHit to='/build'>Build</NavHit>
            </MemoryRouter>
        )

        const link = screen.getByRole('link', { name: 'Build' })
        expect(link.tagName).toBe('A')
        expect(link.getAttribute('href')).toBe('/build')
    })

    it('navigates on click', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter initialEntries={['/']}>
                <NavHit to='/map'>Map</NavHit>
                <Routes>
                    <Route element={<LocationProbe />} path='*' />
                </Routes>
            </MemoryRouter>
        )

        await user.click(screen.getByRole('link', { name: 'Map' }))
        expect(screen.getByTestId('path').textContent).toBe('/map')
    })
})

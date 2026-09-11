// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import {
    NavMenuProvider,
    OVERLAY_NAV_ID,
    OVERLAY_TOGGLE_ID,
    useNavMenu,
} from '@components/app/NavMenuProvider'
import { Header } from '@components/layout/Header'

const OpenDrawer = () => {
    const { openMenu } = useNavMenu()
    return (
        <button type='button' onClick={openMenu}>
            Force open
        </button>
    )
}

describe('Header drawer', () => {
    it('traps Tab across the close toggle and the drawer panel', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <NavMenuProvider>
                    <OpenDrawer />
                    <Header />
                    <a href='/outside'>Outside</a>
                </NavMenuProvider>
            </MemoryRouter>
        )

        await user.click(screen.getByRole('button', { name: 'Force open' }))

        const panel = document.querySelector(`#${OVERLAY_NAV_ID}`)
        const toggle = document.querySelector(`#${OVERLAY_TOGGLE_ID}`)
        expect(panel).not.toBeNull()
        expect(toggle).not.toBeNull()

        await waitFor(() => {
            expect(panel?.contains(document.activeElement)).toBe(true)
        })

        const focusables = [
            toggle as HTMLElement,
            ...(panel?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
            ) ?? []),
        ]
        expect(focusables.length).toBeGreaterThan(1)

        const last = focusables.at(-1)
        last?.focus()
        await user.tab()
        expect(document.activeElement).toBe(focusables[0])
        expect(document.activeElement).toBe(toggle)

        await user.tab({ shift: true })
        expect(document.activeElement).toBe(last)
    })
})

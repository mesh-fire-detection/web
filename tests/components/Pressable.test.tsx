// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Pressable } from '@components/shared/primitives/Pressable'

describe('Pressable', () => {
    it('activates a button on Enter and Space', async () => {
        const user = userEvent.setup()
        const onActivate = vi.fn()

        render(<Pressable onActivate={onActivate}>Go</Pressable>)

        const control = screen.getByRole('button', { name: 'Go' })
        control.focus()
        await user.keyboard('{Enter}')
        await user.keyboard(' ')

        expect(onActivate).toHaveBeenCalledTimes(2)
    })

    it('uses the native disabled state and prevents activation', async () => {
        const user = userEvent.setup()
        const onActivate = vi.fn()

        render(
            <Pressable disabled onActivate={onActivate}>
                Jump
            </Pressable>
        )

        const control = screen.getByRole('button', { name: 'Jump' })
        expect((control as HTMLButtonElement).disabled).toBe(true)
        await user.keyboard('{Enter}')
        await user.keyboard(' ')

        expect(onActivate).not.toHaveBeenCalled()
    })
})

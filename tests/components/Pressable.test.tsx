// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Pressable } from '@components/shared/primitives/Pressable'

describe('Pressable', () => {
    it('activates a button on Enter and Space', async () => {
        const user = userEvent.setup()
        const onActivate = vi.fn()

        render(
            <Pressable onActivate={onActivate} role='button'>
                Go
            </Pressable>
        )

        const control = screen.getByRole('button', { name: 'Go' })
        control.focus()
        await user.keyboard('{Enter}')
        await user.keyboard(' ')

        expect(onActivate).toHaveBeenCalledTimes(2)
    })

    it('activates a link role on Enter only', async () => {
        const user = userEvent.setup()
        const onActivate = vi.fn()

        render(
            <Pressable onActivate={onActivate} role='link'>
                Jump
            </Pressable>
        )

        const control = screen.getByRole('link', { name: 'Jump' })
        control.focus()
        await user.keyboard('{Enter}')
        await user.keyboard(' ')

        expect(onActivate).toHaveBeenCalledTimes(1)
    })
})

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

import { UnitsProvider } from '@components/app/UnitsProvider'
import { CoverageCalculator } from '@components/pages/coverage/CoverageCalculator'

it('hides the calculated result while a numeric field is empty', async () => {
    const user = userEvent.setup()
    render(
        <UnitsProvider>
            <CoverageCalculator />
        </UnitsProvider>
    )
    const input = screen.getByLabelText<HTMLInputElement>('Transmit antenna')
    const original = input.value
    await user.clear(input)
    expect(
        screen.getByText('Please complete the numeric fields to see the calculation.')
    ).toBeTruthy()
    await user.tab()
    expect(input.value).toBe(original)
    expect(
        screen.queryByText('Please complete the numeric fields to see the calculation.')
    ).toBeNull()
})

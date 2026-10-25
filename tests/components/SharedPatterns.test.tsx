// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SubmitEvent } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckboxField, RadioGroup, SegmentedControl } from '@components/shared/forms/ChoiceFields'
import { PasswordField, TextareaField, TextField } from '@components/shared/forms/Field'
import { Form, FormActions, FormSection } from '@components/shared/forms/Form'
import { FileField, NumberField, SliderField } from '@components/shared/forms/NumericFields'
import { DataTable } from '@components/shared/page/DataTable'
import { StepItem, StepList } from '@components/shared/page/StepList'
import { Timeline, TimelineItem } from '@components/shared/page/Timeline'
import { Button } from '@components/shared/widgets/Action'

afterEach(cleanup)

describe('shared patterns', () => {
    it('renders steps as a numbered list', () => {
        render(
            <StepList>
                <StepItem index={1}>Connect the receiver</StepItem>
                <StepItem index={2}>Read its status</StepItem>
            </StepList>
        )

        expect(screen.getByRole('list').textContent).toContain('01Connect the receiver')
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
        expect(screen.getByRole('list').textContent).toContain('02Read its status')
    })

    it('renders timeline items as a list with metadata', () => {
        const { getByRole } = render(
            <Timeline>
                <TimelineItem meta='Today' metaWidth='sm'>
                    Started
                </TimelineItem>
            </Timeline>
        )

        expect(getByRole('listitem').textContent).toBe('TodayStarted')
    })

    it('changes a segmented value on keyboard activation', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <SegmentedControl
                ariaLabel='Units'
                onChange={onChange}
                options={[
                    { value: 'miles', label: 'mi' },
                    { value: 'kilometres', label: 'km' },
                ]}
                value='kilometres'
            />
        )

        const miles = screen.getByRole('button', { name: 'mi' })
        miles.focus()
        await user.keyboard(' ')

        expect(onChange).toHaveBeenCalledWith('miles')
    })

    it('connects text field descriptions and validation errors to the input', () => {
        render(
            <TextField
                description='Used for account access.'
                error='Enter a valid email address.'
                label='Email address'
                onChange={vi.fn()}
                type='email'
                value='invalid'
            />
        )

        const input = screen.getByLabelText('Email address')
        const describedBy = input.getAttribute('aria-describedby')?.split(' ')

        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(describedBy).toHaveLength(2)
        expect(
            document.querySelector(`[id="${CSS.escape(describedBy?.[0] ?? '')}"]`)?.textContent
        ).toBe('Used for account access.')
        expect(
            document.querySelector(`[id="${CSS.escape(describedBy?.[1] ?? '')}"]`)?.textContent
        ).toBe('Enter a valid email address.')
    })

    it('reveals a password without changing its value', async () => {
        const user = userEvent.setup()
        render(<PasswordField label='Password' onChange={vi.fn()} value='long-passphrase' />)

        const password = screen.getByLabelText('Password')
        expect(password.getAttribute('type')).toBe('password')
        await user.click(screen.getByRole('button', { name: 'Show password' }))
        expect(password.getAttribute('type')).toBe('text')
        expect((password as HTMLInputElement).value).toBe('long-passphrase')
    })

    it('uses native checkbox, radio, and textarea controls', () => {
        render(
            <>
                <CheckboxField checked label='Remember this device' onChange={vi.fn()} />
                <RadioGroup
                    label='Account role'
                    onChange={vi.fn()}
                    options={[
                        { value: 'user', label: 'User' },
                        { value: 'admin', label: 'Admin' },
                    ]}
                    value='user'
                />
                <TextareaField label='Notes' onChange={vi.fn()} value='' />
            </>
        )

        expect(screen.getByRole('checkbox', { name: 'Remember this device' })).toBeTruthy()
        expect(screen.getByRole('group', { name: 'Account role' })).toBeTruthy()
        expect(screen.getByRole('radio', { name: 'User' })).toBeTruthy()
        expect(screen.getByRole('textbox', { name: 'Notes' }).tagName).toBe('TEXTAREA')
    })

    it('submits a form when Enter is pressed in a field', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn((event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault()
        })
        render(
            <Form ariaLabel='Invite acceptance' onSubmit={onSubmit}>
                <FormSection title='Your account'>
                    <TextField label='Name' onChange={vi.fn()} value='' />
                </FormSection>
                <FormActions>
                    <Button type='submit'>Create account</Button>
                </FormActions>
            </Form>
        )

        await user.click(screen.getByLabelText('Name'))
        await user.keyboard('{Enter}')
        expect(onSubmit).toHaveBeenCalledOnce()
    })

    it('renders non-finite numbers safely and keeps empty edits out of feature state', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const view = render(<NumberField label='Height' onChange={onChange} value={NaN} />)
        const input = screen.getByRole<HTMLInputElement>('spinbutton')
        expect(input.value).toBe('')
        view.rerender(<NumberField label='Height' onChange={onChange} value={12} />)
        expect(input.value).toBe('12')
        await user.clear(input)
        expect(input.value).toBe('')
        expect(onChange).not.toHaveBeenCalled()
        await user.type(input, '7')
        expect(onChange).toHaveBeenLastCalledWith(7)
    })

    it('retains the native file selection after notifying the owning feature', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const file = new File(['payload'], 'config.json', { type: 'application/json' })
        render(<FileField accept='.json' label='Configuration' onChange={onChange} required />)
        const input = screen.getByLabelText<HTMLInputElement>('Configuration')
        await user.upload(input, file)
        expect(input.files?.[0]).toBe(file)
        expect(input.required).toBe(true)
        expect(onChange).toHaveBeenCalledWith(file)
    })

    it('connects slider guidance and exposes its formatted value', () => {
        render(
            <SliderField
                description='Height above ground.'
                format={(value) => `${value} m`}
                label='Antenna height'
                max={20}
                min={1}
                onChange={vi.fn()}
                value={5}
            />
        )
        const slider = screen.getByRole('slider', { name: 'Antenna height' })
        expect(slider.getAttribute('aria-valuetext')).toBe('5 m')
        expect(slider.getAttribute('aria-describedby')).toBe(
            screen.getByText('Height above ground.').id
        )
    })

    it('exposes table sorting and activates it with the keyboard', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <DataTable
                caption='Nodes'
                columns={[
                    {
                        key: 'name',
                        header: 'Name',
                        sortValue: (row: string) => row,
                        render: (row) => row,
                    },
                ]}
                getRowKey={(row) => row}
                rows={['Node A']}
                sort={{ key: 'name', direction: 'ascending', onChange }}
            />
        )
        expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe('ascending')
        screen.getByRole('button', { name: 'Name' }).focus()
        await user.keyboard('{Enter}')
        expect(onChange).toHaveBeenCalledWith('name')
    })
})

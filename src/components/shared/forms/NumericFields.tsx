import { useId, useState } from 'react'

import type { Option } from '@components/shared/forms/ChoiceFields'
import { FieldShell, describedBy } from '@components/shared/forms/Field'
import { Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'

export function NumberField({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    suffix,
    hint,
    description,
    error,
    required = false,
    disabled = false,
    name,
    onEmptyChange,
}: {
    label: string
    value: number
    onChange: (next: number) => void
    min?: number | undefined
    max?: number | undefined
    step?: number | undefined
    suffix?: string | undefined
    hint?: string | undefined
    description?: string | undefined
    error?: string | undefined
    required?: boolean | undefined
    disabled?: boolean | undefined
    name?: string | undefined
    onEmptyChange?: ((empty: boolean) => void) | undefined
}) {
    const id = useId()
    const initialDraft = Number.isFinite(value) ? String(value) : ''
    const [draftState, setDraftState] = useState({ value, text: initialDraft })
    if (!Object.is(draftState.value, value)) {
        setDraftState({ value, text: initialDraft })
    }
    const draft = Object.is(draftState.value, value) ? draftState.text : initialDraft

    return (
        <FieldShell
            description={description}
            error={error}
            hint={hint}
            htmlFor={id}
            label={label}
            required={required}
            suffix={suffix}
        >
            <input
                aria-describedby={describedBy(id, description, error)}
                aria-invalid={error ? true : undefined}
                className='control_input'
                disabled={disabled}
                id={id}
                inputMode='decimal'
                max={max}
                min={min}
                name={name}
                onChange={(event) => {
                    const nextDraft = event.currentTarget.value
                    setDraftState({ value, text: nextDraft })
                    onEmptyChange?.(nextDraft === '')
                    const nextValue = event.currentTarget.valueAsNumber
                    if (Number.isFinite(nextValue)) onChange(nextValue)
                }}
                onBlur={() => {
                    if (draft !== '' || required) return
                    setDraftState({ value, text: initialDraft })
                    onEmptyChange?.(false)
                }}
                required={required}
                step={step}
                type='number'
                value={draft}
            />
        </FieldShell>
    )
}

export function SelectField<T extends string>({
    label,
    value,
    options,
    onChange,
    hint,
    description,
    error,
    required = false,
    disabled = false,
    name,
}: {
    label: string
    value: T
    options: readonly Option<T>[]
    onChange: (next: T) => void
    hint?: string | undefined
    description?: string | undefined
    error?: string | undefined
    required?: boolean | undefined
    disabled?: boolean | undefined
    name?: string | undefined
}) {
    const id = useId()
    return (
        <FieldShell
            description={description}
            error={error}
            hint={hint}
            htmlFor={id}
            label={label}
            required={required}
        >
            <select
                aria-describedby={describedBy(id, description, error)}
                aria-invalid={error ? true : undefined}
                className='control_input control_input_select'
                disabled={disabled}
                id={id}
                onChange={(event) => {
                    onChange(event.currentTarget.value as T)
                }}
                name={name}
                required={required}
                value={value}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </FieldShell>
    )
}

export function FileField({
    label,
    accept,
    onChange,
    hint,
    description,
    error,
    required = false,
    disabled = false,
    name,
}: {
    label: string
    accept: string
    onChange: (file: File | null) => void
    hint?: string | undefined
    description?: string | undefined
    error?: string | undefined
    required?: boolean | undefined
    disabled?: boolean | undefined
    name?: string | undefined
}) {
    const id = useId()
    return (
        <FieldShell
            description={description}
            error={error}
            hint={hint}
            htmlFor={id}
            label={label}
            required={required}
        >
            <input
                aria-describedby={describedBy(id, description, error)}
                aria-invalid={error ? true : undefined}
                accept={accept}
                className='control_input'
                disabled={disabled}
                id={id}
                name={name}
                onChange={(event) => {
                    onChange(event.currentTarget.files?.[0] ?? null)
                }}
                required={required}
                type='file'
            />
        </FieldShell>
    )
}

export function SliderField({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    format,
    name,
    description,
    disabled = false,
}: {
    label: string
    value: number
    onChange: (next: number) => void
    min: number
    max: number
    step?: number | undefined
    format: (value: number) => string
    name?: string | undefined
    description?: string | undefined
    disabled?: boolean | undefined
}) {
    const id = useId()
    return (
        <Stack gap={2}>
            <Row gap={2} justify='between'>
                <label className='field_label' htmlFor={id}>
                    {label}
                </label>
                <Text as='span' mono size='xs' tone='fire' weight={600}>
                    {format(value)}
                </Text>
            </Row>
            <input
                aria-describedby={description ? `${id}-description` : undefined}
                aria-valuetext={format(value)}
                className='slider'
                disabled={disabled}
                id={id}
                max={max}
                min={min}
                name={name}
                onChange={(event) => {
                    onChange(event.currentTarget.valueAsNumber)
                }}
                step={step}
                type='range'
                value={value}
            />
            {description ? (
                <Text id={`${id}-description`} size='xs' tone='faint'>
                    {description}
                </Text>
            ) : null}
        </Stack>
    )
}

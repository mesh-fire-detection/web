import { useId, type ReactNode } from 'react'

import { cx } from '@/lib/cx'

import { Row, Stack } from '../core/Layout'
import { Text } from '../core/Text'

import { Pressable } from './Pressable'

function FieldShell({
    label,
    hint,
    suffix,
    htmlFor,
    children,
}: {
    label: string
    hint?: string | undefined
    suffix?: string | undefined
    htmlFor: string
    children: ReactNode
}) {
    return (
        <Stack gap={2}>
            <Row gap={2} justify='between'>
                <label
                    className='txt txt_2xs tone_faint w_600 txt_mono txt_upper'
                    htmlFor={htmlFor}
                >
                    {label}
                </label>
                {hint ? (
                    <Text as='span' size='2xs' tone='faint'>
                        {hint}
                    </Text>
                ) : null}
            </Row>
            <div className='control'>
                {children}
                {suffix ? (
                    <Text as='span' className='control_suffix' mono size='xs' tone='faint'>
                        {suffix}
                    </Text>
                ) : null}
            </div>
        </Stack>
    )
}

export function NumberField({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    suffix,
    hint,
}: {
    label: string
    value: number
    onChange: (next: number) => void
    min?: number | undefined
    max?: number | undefined
    step?: number | undefined
    suffix?: string | undefined
    hint?: string | undefined
}) {
    const id = useId()
    return (
        <FieldShell hint={hint} htmlFor={id} label={label} suffix={suffix}>
            <input
                className='control_input'
                id={id}
                inputMode='decimal'
                max={max}
                min={min}
                onChange={(event) => {
                    onChange(event.currentTarget.valueAsNumber)
                }}
                step={step}
                type='number'
                value={Number.isFinite(value) ? value : ''}
            />
        </FieldShell>
    )
}

export type Option<T extends string> = {
    value: T
    label: string
}

export function SelectField<T extends string>({
    label,
    value,
    options,
    onChange,
    hint,
}: {
    label: string
    value: T
    options: readonly Option<T>[]
    onChange: (next: T) => void
    hint?: string | undefined
}) {
    const id = useId()
    return (
        <FieldShell hint={hint} htmlFor={id} label={label}>
            <select
                className='control_input control_input_select'
                id={id}
                onChange={(event) => {
                    onChange(event.currentTarget.value as T)
                }}
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

export function SliderField({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    format,
}: {
    label: string
    value: number
    onChange: (next: number) => void
    min: number
    max: number
    step?: number | undefined
    format: (value: number) => string
}) {
    const id = useId()
    return (
        <Stack gap={2}>
            <Row gap={2} justify='between'>
                <label className='txt txt_2xs tone_faint w_600 txt_mono txt_upper' htmlFor={id}>
                    {label}
                </label>
                <Text as='span' mono size='xs' tone='fire' weight={600}>
                    {format(value)}
                </Text>
            </Row>
            <input
                className='slider'
                id={id}
                max={max}
                min={min}
                onChange={(event) => {
                    onChange(event.currentTarget.valueAsNumber)
                }}
                step={step}
                type='range'
                value={value}
            />
        </Stack>
    )
}

/** Segmented single-choice control. Reads better than a select for 2–4 options. */
export function SegmentedField<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string
    value: T
    options: readonly Option<T>[]
    onChange: (next: T) => void
}) {
    return (
        <Stack gap={2}>
            <Text as='div' mono size='2xs' tone='faint' uppercase weight={600}>
                {label}
            </Text>
            <Row ariaLabel={label} className='segmented' gap={0} role='group' wrap={false}>
                {options.map((option) => (
                    <Pressable
                        className={cx(
                            'segmented_item',
                            option.value === value && 'segmented_item_on'
                        )}
                        key={option.value}
                        onActivate={() => {
                            onChange(option.value)
                        }}
                        pressed={option.value === value}
                        role='button'
                    >
                        <Text as='span' mono size='xs' tone='inherit' weight={600}>
                            {option.label}
                        </Text>
                    </Pressable>
                ))}
            </Row>
        </Stack>
    )
}

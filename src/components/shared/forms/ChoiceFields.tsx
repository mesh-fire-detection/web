import { useId } from 'react'

import { Row, Stack } from '@components/shared/primitives/Layout'
import { Pressable } from '@components/shared/primitives/Pressable'
import { Text } from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'

export function CheckboxField({
    label,
    checked,
    onChange,
    name,
    description,
    disabled = false,
    error,
    required = false,
}: {
    label: string
    checked: boolean
    onChange: (next: boolean) => void
    name?: string | undefined
    description?: string | undefined
    disabled?: boolean | undefined
    error?: string | undefined
    required?: boolean | undefined
}) {
    const id = useId()
    return (
        <Stack gap={1}>
            <label className='choice_field' htmlFor={id}>
                <input
                    aria-describedby={
                        [description && `${id}-description`, error && `${id}-error`]
                            .filter(Boolean)
                            .join(' ') || undefined
                    }
                    aria-invalid={error ? true : undefined}
                    checked={checked}
                    className='choice_input'
                    disabled={disabled}
                    id={id}
                    name={name}
                    onChange={(event) => {
                        onChange(event.currentTarget.checked)
                    }}
                    required={required}
                    type='checkbox'
                />
                <span aria-hidden className='choice_indicator' />
                <Text as='span' size='sm' tone={disabled ? 'faint' : 'default'}>
                    {label}
                </Text>
                {required ? <span className='field_required'>Required</span> : null}
            </label>
            {description ? (
                <Text
                    className='choice_description'
                    id={`${id}-description`}
                    size='xs'
                    tone='faint'
                >
                    {description}
                </Text>
            ) : null}
            {error ? (
                <Text
                    className='choice_description'
                    id={`${id}-error`}
                    role='alert'
                    size='xs'
                    tone='dead'
                >
                    {error}
                </Text>
            ) : null}
        </Stack>
    )
}

export function RadioGroup<T extends string>({
    label,
    value,
    options,
    onChange,
    name,
    description,
    disabled = false,
    error,
    required = false,
}: {
    label: string
    value: T
    options: readonly Option<T>[]
    onChange: (next: T) => void
    name?: string | undefined
    description?: string | undefined
    disabled?: boolean | undefined
    error?: string | undefined
    required?: boolean | undefined
}) {
    const id = useId()
    const inputName = name ?? id
    return (
        <fieldset
            aria-describedby={
                [description && `${id}-description`, error && `${id}-error`]
                    .filter(Boolean)
                    .join(' ') || undefined
            }
            className='field_group'
            disabled={disabled}
        >
            <legend className='field_label'>
                {label}
                {required ? <span className='field_required'>Required</span> : null}
            </legend>
            {description ? (
                <Text className='field_description' id={`${id}-description`} size='xs' tone='faint'>
                    {description}
                </Text>
            ) : null}
            {error ? (
                <Text className='field_error' id={`${id}-error`} role='alert' size='xs' tone='dead'>
                    {error}
                </Text>
            ) : null}
            <Stack gap={2}>
                {options.map((option, index) => {
                    const optionId = `${id}-${String(index)}`
                    return (
                        <label className='choice_field' htmlFor={optionId} key={option.value}>
                            <input
                                aria-describedby={
                                    [description && `${id}-description`, error && `${id}-error`]
                                        .filter(Boolean)
                                        .join(' ') || undefined
                                }
                                checked={option.value === value}
                                className='choice_input'
                                id={optionId}
                                name={inputName}
                                onChange={() => {
                                    onChange(option.value)
                                }}
                                required={required}
                                type='radio'
                                value={option.value}
                            />
                            <span aria-hidden className='choice_indicator' />
                            <Text as='span' size='sm'>
                                {option.label}
                            </Text>
                        </label>
                    )
                })}
            </Stack>
        </fieldset>
    )
}

export type Option<T extends string> = {
    value: T
    label: string
}

export function SegmentedControl<T extends string>({
    ariaLabel,
    value,
    options,
    onChange,
}: {
    ariaLabel: string
    value: T
    options: readonly Option<T>[]
    onChange: (next: T) => void
}) {
    return (
        <Row ariaLabel={ariaLabel} className='segmented' gap={0} role='group' wrap={false}>
            {options.map((option) => (
                <Pressable
                    className={cx('segmented_item', option.value === value && 'segmented_item_on')}
                    key={option.value}
                    onActivate={() => {
                        onChange(option.value)
                    }}
                    pressed={option.value === value}
                >
                    <Text as='span' mono size='xs' tone='inherit' weight={600}>
                        {option.label}
                    </Text>
                </Pressable>
            ))}
        </Row>
    )
}

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
        <fieldset className='field_group'>
            <legend className='field_label'>{label}</legend>
            <SegmentedControl
                ariaLabel={label}
                onChange={onChange}
                options={options}
                value={value}
            />
        </fieldset>
    )
}

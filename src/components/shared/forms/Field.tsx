import { useId, useState, type ReactNode, type Ref } from 'react'

import { Row, Stack } from '@components/shared/primitives/Layout'
import { Pressable } from '@components/shared/primitives/Pressable'
import { Text } from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'

export function FieldShell({
    label,
    hint,
    description,
    error,
    required,
    suffix,
    action,
    htmlFor,
    children,
}: {
    label: string
    hint?: string | undefined
    description?: string | undefined
    error?: string | undefined
    required?: boolean | undefined
    suffix?: string | undefined
    action?: ReactNode | undefined
    htmlFor: string
    children: ReactNode
}) {
    return (
        <Stack gap={2}>
            <Row gap={2} justify='between'>
                <label className='field_label' htmlFor={htmlFor}>
                    {label}
                </label>
                {required ? <span className='field_required'>Required</span> : null}
                {hint ? (
                    <Text as='span' size='2xs' tone='faint'>
                        {hint}
                    </Text>
                ) : null}
            </Row>
            <div className={cx('control', error && 'control_invalid')}>
                {children}
                {suffix ? (
                    <Text as='span' className='control_suffix' mono size='xs' tone='faint'>
                        {suffix}
                    </Text>
                ) : null}
                {action}
            </div>
            {description ? (
                <Text
                    as='span'
                    className='field_description'
                    id={`${htmlFor}-description`}
                    size='xs'
                    tone='faint'
                >
                    {description}
                </Text>
            ) : null}
            {error ? (
                <Text
                    as='span'
                    className='field_error'
                    id={`${htmlFor}-error`}
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

export function describedBy(id: string, description?: string, error?: string) {
    return (
        [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') ||
        undefined
    )
}

type TextInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'

export function TextField({
    label,
    value,
    onChange,
    type = 'text',
    name,
    autoComplete,
    inputMode,
    placeholder,
    hint,
    description,
    error,
    required = false,
    disabled = false,
    inputRef,
}: {
    label: string
    value: string
    onChange: (next: string) => void
    type?: TextInputType | undefined
    name?: string | undefined
    autoComplete?: string | undefined
    inputMode?: 'text' | 'email' | 'search' | 'tel' | 'url' | 'numeric' | 'decimal' | undefined
    placeholder?: string | undefined
    hint?: string | undefined
    description?: string | undefined
    error?: string | undefined
    required?: boolean | undefined
    disabled?: boolean | undefined
    /** For a flow that moves focus to this field when it appears. */
    inputRef?: Ref<HTMLInputElement> | undefined
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
                ref={inputRef}
                aria-describedby={describedBy(id, description, error)}
                aria-invalid={error ? true : undefined}
                autoComplete={autoComplete}
                className='control_input'
                disabled={disabled}
                id={id}
                inputMode={inputMode}
                name={name}
                onChange={(event) => {
                    onChange(event.currentTarget.value)
                }}
                placeholder={placeholder}
                required={required}
                type={type}
                value={value}
            />
        </FieldShell>
    )
}

export function PasswordField({
    label,
    value,
    onChange,
    name,
    autoComplete = 'current-password',
    hint,
    description,
    error,
    required = false,
    disabled = false,
}: {
    label: string
    value: string
    onChange: (next: string) => void
    name?: string | undefined
    autoComplete?: 'current-password' | 'new-password' | undefined
    hint?: string | undefined
    description?: string | undefined
    error?: string | undefined
    required?: boolean | undefined
    disabled?: boolean | undefined
}) {
    const id = useId()
    const [visible, setVisible] = useState(false)
    return (
        <FieldShell
            action={
                <Pressable
                    accessibleLabel={visible ? 'Hide password' : 'Show password'}
                    className='field_reveal'
                    disabled={disabled}
                    onActivate={() => {
                        setVisible(!visible)
                    }}
                    pressed={visible}
                >
                    {visible ? 'Hide' : 'Show'}
                </Pressable>
            }
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
                autoComplete={autoComplete}
                className='control_input'
                disabled={disabled}
                id={id}
                name={name}
                onChange={(event) => {
                    onChange(event.currentTarget.value)
                }}
                required={required}
                type={visible ? 'text' : 'password'}
                value={value}
            />
        </FieldShell>
    )
}

export function TextareaField({
    label,
    value,
    onChange,
    name,
    rows = 4,
    maxLength,
    hint,
    description,
    error,
    required = false,
    disabled = false,
}: {
    label: string
    value: string
    onChange: (next: string) => void
    name?: string | undefined
    rows?: number | undefined
    maxLength?: number | undefined
    hint?: string | undefined
    description?: string | undefined
    error?: string | undefined
    required?: boolean | undefined
    disabled?: boolean | undefined
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
            <textarea
                aria-describedby={describedBy(id, description, error)}
                aria-invalid={error ? true : undefined}
                className='control_input control_textarea'
                disabled={disabled}
                id={id}
                maxLength={maxLength}
                name={name}
                onChange={(event) => {
                    onChange(event.currentTarget.value)
                }}
                required={required}
                rows={rows}
                value={value}
            />
        </FieldShell>
    )
}

export function SearchField({
    label,
    value,
    onChange,
    name,
    description,
    placeholder,
}: {
    label: string
    value: string
    onChange: (next: string) => void
    name?: string | undefined
    description?: string | undefined
    placeholder?: string | undefined
}) {
    const id = useId()
    return (
        <FieldShell description={description} htmlFor={id} label={label}>
            <input
                aria-describedby={description ? `${id}-description` : undefined}
                className='control_input'
                id={id}
                name={name}
                onChange={(event) => {
                    onChange(event.currentTarget.value)
                }}
                placeholder={placeholder}
                type='search'
                value={value}
            />
            {value ? (
                <Pressable
                    accessibleLabel={`Clear ${label.toLocaleLowerCase()}`}
                    className='field_reveal'
                    onActivate={() => {
                        onChange('')
                    }}
                >
                    Clear
                </Pressable>
            ) : null}
        </FieldShell>
    )
}

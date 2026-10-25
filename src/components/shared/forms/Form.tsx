import { useId, type ReactNode, type SubmitEventHandler } from 'react'

import { Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'

export function Form({
    children,
    onSubmit,
    ariaLabel,
    className,
    busy = false,
}: {
    children: ReactNode
    onSubmit: SubmitEventHandler<HTMLFormElement>
    ariaLabel?: string | undefined
    className?: string | undefined
    busy?: boolean | undefined
}) {
    return (
        <form
            aria-busy={busy || undefined}
            aria-label={ariaLabel}
            className={cx('form', className)}
            onSubmit={onSubmit}
        >
            {children}
        </form>
    )
}

export function FormSection({
    title,
    children,
    description,
    disabled = false,
}: {
    title: string
    children: ReactNode
    description?: string | undefined
    disabled?: boolean | undefined
}) {
    const id = useId()
    return (
        <fieldset
            aria-describedby={description ? `${id}-description` : undefined}
            className='form_section'
            disabled={disabled}
        >
            <legend className='form_legend'>{title}</legend>
            {description ? (
                <Text className='field_description' id={`${id}-description`} size='sm' tone='muted'>
                    {description}
                </Text>
            ) : null}
            <Stack gap={4}>{children}</Stack>
        </fieldset>
    )
}

export function FormActions({ children }: { children: ReactNode }) {
    return (
        <Row className='form_actions' justify='end'>
            {children}
        </Row>
    )
}

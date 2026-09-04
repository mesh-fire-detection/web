import { useId } from 'react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Text } from '../core/Text'
import { Stack, Row } from '../core/Layout'

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
      <Row justify="between" gap={2}>
        <Text as="label" htmlFor={htmlFor} size="2xs" mono uppercase weight={600} tone="faint">
          {label}
        </Text>
        {hint ? (
          <Text as="span" size="2xs" tone="faint">
            {hint}
          </Text>
        ) : null}
      </Row>
      <div className={cx('control', suffix && 'control--suffixed')}>
        {children}
        {suffix ? (
          <Text as="span" size="xs" mono tone="faint" className="control__suffix">
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
    <FieldShell label={label} hint={hint} suffix={suffix} htmlFor={id}>
      <input
        id={id}
        type="number"
        className="control__input"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        inputMode="decimal"
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </FieldShell>
  )
}

export interface Option<T extends string> {
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
  options: ReadonlyArray<Option<T>>
  onChange: (next: T) => void
  hint?: string | undefined
}) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <select
        id={id}
        className="control__input control__input--select"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as T)}
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
      <Row justify="between" gap={2}>
        <Text as="label" htmlFor={id} size="2xs" mono uppercase weight={600} tone="faint">
          {label}
        </Text>
        <Text as="span" size="xs" mono weight={600} tone="fire">
          {format(value)}
        </Text>
      </Row>
      <input
        id={id}
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
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
  options: ReadonlyArray<Option<T>>
  onChange: (next: T) => void
}) {
  return (
    <Stack gap={2}>
      <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
        {label}
      </Text>
      <Row gap={0} wrap={false} className="segmented" role="group" ariaLabel={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            className={cx('segmented__item', option.value === value && 'segmented__item--on')}
            onClick={() => onChange(option.value)}
          >
            <Text as="span" size="xs" mono weight={600} tone="inherit">
              {option.label}
            </Text>
          </button>
        ))}
      </Row>
    </Stack>
  )
}

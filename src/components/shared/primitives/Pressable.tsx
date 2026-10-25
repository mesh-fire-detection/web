import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

type PressableProperties = {
    readonly children: ReactNode
    readonly className?: string | undefined
    readonly onActivate: () => void
    readonly accessibleLabel?: string | undefined
    readonly disabled?: boolean | undefined
    readonly pressed?: boolean | undefined
    readonly busy?: boolean | undefined
    readonly type?: ButtonHTMLAttributes<HTMLButtonElement>['type'] | undefined
    readonly ariaControls?: string | undefined
    readonly ariaExpanded?: boolean | undefined
    readonly ariaHasPopup?: boolean | 'menu' | undefined
    readonly id?: string | undefined
    readonly ref?: Ref<HTMLButtonElement> | undefined
}

/** Native button with shared activation, disabled, and toggle semantics. */
export const Pressable = ({
    children,
    className,
    onActivate,
    accessibleLabel,
    disabled = false,
    pressed,
    busy = false,
    type = 'button',
    ariaControls,
    ariaExpanded,
    ariaHasPopup,
    id,
    ref,
}: PressableProperties) => {
    return (
        <button
            ref={ref}
            aria-controls={ariaControls}
            aria-busy={busy || undefined}
            aria-expanded={ariaExpanded}
            aria-haspopup={ariaHasPopup}
            aria-label={accessibleLabel}
            aria-pressed={pressed}
            className={className}
            disabled={disabled}
            id={id}
            onClick={onActivate}
            type={type}
        >
            {children}
        </button>
    )
}

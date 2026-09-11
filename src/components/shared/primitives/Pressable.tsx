import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, Ref } from 'react'

import { activationKeyDown, linkActivationKeyDown } from '@core/a11y/interactive'

type PressableProperties = {
    readonly children: ReactNode
    readonly className?: string | undefined
    readonly onActivate: () => void
    readonly role: 'button' | 'link'
    readonly accessibleLabel?: string | undefined
    readonly disabled?: boolean | undefined
    readonly pressed?: boolean | undefined
    readonly ariaControls?: string | undefined
    readonly ariaExpanded?: boolean | undefined
    readonly ariaCurrent?: 'page' | undefined
    readonly ariaHasPopup?: boolean | 'menu' | undefined
    readonly id?: string | undefined
    readonly ref?: Ref<HTMLDivElement> | undefined
}

/**
 * Activate-on-click control with the keyboard contract the markup rules require.
 * Roles are spelled out per branch so jsx-a11y can verify them literally.
 * Links activate on Enter only (Space scrolls, matching native `<a>`).
 */
export const Pressable = ({
    children,
    className,
    onActivate,
    role,
    accessibleLabel,
    disabled = false,
    pressed,
    ariaControls,
    ariaExpanded,
    ariaCurrent,
    ariaHasPopup,
    id,
    ref,
}: PressableProperties) => {
    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (disabled) return
        if (role === 'link') linkActivationKeyDown(event, onActivate)
        else activationKeyDown(event, onActivate)
    }

    const activate = () => {
        if (disabled) return
        onActivate()
    }

    if (role === 'link') {
        return (
            <div
                ref={ref}
                aria-controls={ariaControls}
                aria-current={ariaCurrent}
                aria-disabled={disabled || undefined}
                aria-expanded={ariaExpanded}
                aria-haspopup={ariaHasPopup}
                aria-label={accessibleLabel}
                className={className}
                id={id}
                onClick={activate}
                onKeyDown={onKeyDown}
                role='link'
                tabIndex={disabled ? -1 : 0}
            >
                {children}
            </div>
        )
    }

    return (
        <div
            ref={ref}
            aria-controls={ariaControls}
            aria-disabled={disabled || undefined}
            aria-expanded={ariaExpanded}
            aria-haspopup={ariaHasPopup}
            aria-label={accessibleLabel}
            aria-pressed={pressed}
            className={className}
            id={id}
            onClick={activate}
            onKeyDown={onKeyDown}
            role='button'
            tabIndex={disabled ? -1 : 0}
        >
            {children}
        </div>
    )
}

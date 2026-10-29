import type { ReactNode } from 'react'

import { ExternalLink, type ExternalHref } from '@components/shared/navigation/ExternalLink'
import { NavHit } from '@components/shared/navigation/NavHit'
import { Pressable } from '@components/shared/primitives/Pressable'
import { cx } from '@core/format/cx'

export type ButtonVariant =
    'primary' | 'secondary' | 'ghost' | 'danger' | 'bluetooth' | 'usb' | 'contrast'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ActionBase = {
    children: ReactNode
    variant?: ButtonVariant | undefined
    size?: ButtonSize | undefined
    full?: boolean | undefined
    iconBefore?: ReactNode | undefined
    iconAfter?: ReactNode | undefined
    className?: string | undefined
}

function actionClass(variant: ButtonVariant, size: ButtonSize, full: boolean, className?: string) {
    return cx('act', `act_${variant}`, `act_${size}`, full && 'act_full', className)
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    full = false,
    iconBefore,
    iconAfter,
    onClick,
    disabled = false,
    pressed,
    loading = false,
    type = 'button',
    label,
    className,
    ariaControls,
    ariaExpanded,
    id,
}: ActionBase & {
    onClick?: (() => void) | undefined
    disabled?: boolean | undefined
    pressed?: boolean | undefined
    loading?: boolean | undefined
    type?: 'button' | 'submit' | 'reset' | undefined
    label?: string | undefined
    ariaControls?: string | undefined
    ariaExpanded?: boolean | undefined
    id?: string | undefined
}) {
    return (
        <Pressable
            accessibleLabel={label}
            ariaControls={ariaControls}
            ariaExpanded={ariaExpanded}
            busy={loading}
            className={actionClass(variant, size, full, cx(loading && 'act_loading', className))}
            disabled={disabled || loading}
            id={id}
            onActivate={() => {
                onClick?.()
            }}
            pressed={pressed}
            type={type}
        >
            <span className='act_content'>
                {iconBefore}
                {children}
                {iconAfter}
            </span>
        </Pressable>
    )
}

export function IconButton({
    children,
    label,
    variant = 'ghost',
    onClick,
    disabled = false,
    className,
}: {
    children: ReactNode
    label: string
    variant?: ButtonVariant | undefined
    onClick: () => void
    disabled?: boolean | undefined
    className?: string | undefined
}) {
    return (
        <Button
            className={cx('icon_button', className)}
            disabled={disabled}
            label={label}
            onClick={onClick}
            size='sm'
            variant={variant}
        >
            {children}
        </Button>
    )
}

/** Internal route link styled as a button. */
export function ButtonLink({
    children,
    to,
    variant = 'primary',
    size = 'md',
    full = false,
    iconBefore,
    iconAfter,
    className,
    label,
}: ActionBase & {
    to: string
    /** Required in practice when the only child is an icon. */
    label?: string | undefined
}) {
    return (
        <NavHit
            accessibleLabel={label}
            className={actionClass(variant, size, full, className)}
            to={to}
        >
            {iconBefore}
            {children}
            {iconAfter}
        </NavHit>
    )
}

/** External link styled as a button. Always opens in a new tab. */
export function ButtonAnchor({
    children,
    href,
    variant = 'secondary',
    size = 'md',
    full = false,
    iconBefore,
    iconAfter,
    download = false,
    className,
}: ActionBase & { href: ExternalHref; download?: boolean }) {
    return (
        <ExternalLink
            className={actionClass(variant, size, full, className)}
            download={download}
            href={href}
        >
            {iconBefore}
            {children}
            {iconAfter}
        </ExternalLink>
    )
}

/** Inline text link. Routes internally, opens externally in a new tab. */
export function TextLink({
    children,
    to,
    tone = 'link',
    size,
    mono = false,
}: {
    children: ReactNode
    to: string
    tone?: 'link' | 'quiet' | 'fire' | undefined
    size?: 'xs' | 'sm' | 'md' | undefined
    mono?: boolean | undefined
}) {
    const className = cx('tlink', `tlink_${tone}`, size && `txt_${size}`, mono && 'txt_mono')
    return to.startsWith('https://') || to.startsWith('mailto:') ? (
        <ExternalLink className={className} href={to as ExternalHref}>
            {children}
        </ExternalLink>
    ) : (
        <NavHit className={className} to={to}>
            {children}
        </NavHit>
    )
}

/** Navigation link that knows whether it is the active route. */
export function NavLink({
    children,
    to,
    end = false,
}: {
    children: ReactNode
    to: string
    end?: boolean
}) {
    return (
        <NavHit activeClassName='navlink_active' className='navlink' end={end} to={to}>
            {children}
        </NavHit>
    )
}

/** Square icon-only link, for the GitHub mark in the header. */
export function IconLink({
    children,
    href,
    label,
    className,
}: {
    children: ReactNode
    href: ExternalHref
    label: string
    className?: string | undefined
}) {
    return (
        <ExternalLink accessibleLabel={label} className={cx('iconlink', className)} href={href}>
            {children}
        </ExternalLink>
    )
}

/**
 * Makes an arbitrary region clickable without inheriting any button styling.
 * For table rows and cards, where the visual treatment belongs to the content.
 */
export function BareButton({
    children,
    onClick,
    label,
    className,
}: {
    children: ReactNode
    onClick: () => void
    label?: string | undefined
    className?: string | undefined
}) {
    return (
        <Pressable accessibleLabel={label} className={cx('bare', className)} onActivate={onClick}>
            {children}
        </Pressable>
    )
}

/** Keyboard-only jump to the main landmark. */
export function SkipLink({ to, children }: { to: string; children: ReactNode }) {
    return (
        <Pressable
            className='skip'
            onActivate={() => {
                const id = to.startsWith('#') ? to.slice(1) : to
                const target = document.querySelector(`#${id}`)
                if (target instanceof HTMLElement) target.focus()
            }}
        >
            {children}
        </Pressable>
    )
}

/** Anchor wrapper that carries no styling of its own. */
export function LinkCard({
    children,
    href,
    download = false,
    className,
}: {
    children: ReactNode
    href: ExternalHref
    download?: boolean
    className?: string | undefined
}) {
    return (
        <ExternalLink className={cx('linkcard', className)} download={download} href={href}>
            {children}
        </ExternalLink>
    )
}

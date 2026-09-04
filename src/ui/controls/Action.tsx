import type { ReactNode } from 'react'
import { NavLink as RouterNavLink, Link as RouterLink } from 'react-router-dom'
import { cx } from '@/lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ActionBase {
  children: ReactNode
  variant?: ButtonVariant | undefined
  size?: ButtonSize | undefined
  full?: boolean | undefined
  iconBefore?: ReactNode | undefined
  iconAfter?: ReactNode | undefined
  className?: string | undefined
}

function actionClass(
  variant: ButtonVariant,
  size: ButtonSize,
  full: boolean,
  className?: string | undefined,
) {
  return cx('act', `act--${variant}`, `act--${size}`, full && 'act--full', className)
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  iconBefore,
  iconAfter,
  onClick,
  type = 'button',
  disabled = false,
  pressed,
  label,
  className,
}: ActionBase & {
  onClick?: (() => void) | undefined
  type?: 'button' | 'submit' | 'reset' | undefined
  disabled?: boolean | undefined
  pressed?: boolean | undefined
  label?: string | undefined
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      className={actionClass(variant, size, full, className)}
    >
      {iconBefore}
      {children}
      {iconAfter}
    </button>
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
}: ActionBase & { to: string }) {
  return (
    <RouterLink to={to} className={actionClass(variant, size, full, className)}>
      {iconBefore}
      {children}
      {iconAfter}
    </RouterLink>
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
}: ActionBase & { href: string; download?: boolean }) {
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      {...(download ? { download: '' } : null)}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
      className={actionClass(variant, size, full, className)}
    >
      {iconBefore}
      {children}
      {iconAfter}
    </a>
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
  const className = cx('tlink', `tlink--${tone}`, size && `txt--${size}`, mono && 'txt--mono')
  if (to.startsWith('http') || to.startsWith('mailto:')) {
    return (
      <a href={to} target="_blank" rel="noreferrer noopener" className={className}>
        {children}
      </a>
    )
  }
  return (
    <RouterLink to={to} className={className}>
      {children}
    </RouterLink>
  )
}

/** Navigation link that knows whether it is the active route. */
export function NavLink({ children, to, end = false }: { children: ReactNode; to: string; end?: boolean }) {
  return (
    <RouterNavLink to={to} end={end} className={({ isActive }) => cx('navlink', isActive && 'navlink--active')}>
      {children}
    </RouterNavLink>
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
  href: string
  label: string
  className?: string | undefined
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className={cx('iconlink', className)}
    >
      {children}
    </a>
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
    <button type="button" onClick={onClick} aria-label={label} className={cx('bare', className)}>
      {children}
    </button>
  )
}

/** Keyboard-only jump to the main landmark. */
export function SkipLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a href={to} className="skip">
      {children}
    </a>
  )
}

/** Anchor wrapper that carries no styling of its own. */
export function LinkCard({
  children,
  href,
  download = false,
  external = false,
  className,
}: {
  children: ReactNode
  href: string
  download?: boolean
  external?: boolean
  className?: string | undefined
}) {
  return (
    <a
      href={href}
      {...(download ? { download: '' } : null)}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
      className={cx('linkcard', className)}
    >
      {children}
    </a>
  )
}

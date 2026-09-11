import type { ReactNode } from 'react'
import { NavLink as RouterNavLink } from 'react-router-dom'

import { cx } from '@core/format/cx'

type NavHitProperties = {
    readonly to: string
    readonly children: ReactNode
    readonly className?: string | undefined
    readonly activeClassName?: string | undefined
    readonly end?: boolean | undefined
    readonly accessibleLabel?: string | undefined
}

/**
 * In-app navigation as a real `<a href>`. React Router handles the client
 * transition; middle-click, copy-link, and crawlers see a normal URL.
 */
export const NavHit = ({
    to,
    children,
    className,
    activeClassName,
    end = false,
    accessibleLabel,
}: NavHitProperties) => {
    return (
        <RouterNavLink
            aria-label={accessibleLabel}
            className={({ isActive }) => cx(className, isActive && activeClassName)}
            end={end}
            to={to}
        >
            {children}
        </RouterNavLink>
    )
}

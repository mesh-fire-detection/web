import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Pressable } from '@components/shared/primitives/Pressable'
import { cx } from '@core/format/cx'

type NavHitProperties = {
    readonly to: string
    readonly children: ReactNode
    readonly className?: string | undefined
    readonly activeClassName?: string | undefined
    readonly end?: boolean | undefined
    readonly accessibleLabel?: string | undefined
}

const pathOf = (to: string): string => {
    const hash = to.indexOf('#')
    return hash === -1 ? to : to.slice(0, hash)
}

export const NavHit = ({
    to,
    children,
    className,
    activeClassName,
    end = false,
    accessibleLabel,
}: NavHitProperties) => {
    const navigate = useNavigate()
    const location = useLocation()
    const path = pathOf(to)
    const isActive = end
        ? location.pathname === path
        : location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

    return (
        <Pressable
            accessibleLabel={accessibleLabel}
            ariaCurrent={isActive ? 'page' : undefined}
            className={cx(className, isActive && activeClassName)}
            onActivate={() => {
                void navigate(to)
            }}
            role='link'
        >
            {children}
        </Pressable>
    )
}

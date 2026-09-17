import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'

type NavMenuValue = {
    readonly open: boolean
    readonly openMenu: () => void
    readonly closeMenu: () => void
}

const NavMenuContext = createContext<NavMenuValue | null>(null)

export const OVERLAY_NAV_ID = 'overlay_nav'
export const OVERLAY_TOGGLE_ID = 'overlay_nav_toggle'

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'

const focusablesIn = (root: HTMLElement): HTMLElement[] => {
    return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
        (node) => !node.hasAttribute('disabled') && node.getAttribute('aria-disabled') !== 'true'
    )
}

/** Toggle (outside the panel) + everything focusable inside the drawer. */
const trapFocusables = (): HTMLElement[] => {
    const nodes: HTMLElement[] = []
    const toggle = document.querySelector(`#${OVERLAY_TOGGLE_ID}`)
    if (toggle instanceof HTMLElement) nodes.push(toggle)

    const panel = document.querySelector(`#${OVERLAY_NAV_ID}`)
    if (panel instanceof HTMLElement) nodes.push(...focusablesIn(panel))

    return nodes
}

type NavMenuProviderProperties = {
    readonly children: ReactNode
}

export const NavMenuProvider = ({ children }: NavMenuProviderProperties) => {
    const [open, setOpen] = useState(false)
    const returnFocusRef = useRef<HTMLElement | null>(null)
    const wasOpenRef = useRef(false)

    const openMenu = useCallback(() => {
        const active = document.activeElement
        returnFocusRef.current = active instanceof HTMLElement ? active : null
        setOpen(true)
    }, [])

    const closeMenu = useCallback(() => {
        setOpen(false)
    }, [])

    useEffect(() => {
        if (open) {
            wasOpenRef.current = true
            const panel = document.querySelector(`#${OVERLAY_NAV_ID}`)
            if (panel instanceof HTMLElement) {
                const first = focusablesIn(panel)[0]
                first?.focus()
            }
            return
        }

        if (!wasOpenRef.current) return

        wasOpenRef.current = false
        const node = returnFocusRef.current
        returnFocusRef.current = null
        node?.focus()
    }, [open])

    useEffect(() => {
        if (!open) return

        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                event.preventDefault()
                setOpen(false)
                return
            }

            if (event.key !== 'Tab') return

            const nodes = trapFocusables()
            if (nodes.length === 0) return

            const first = nodes[0]
            const last = nodes.at(-1)
            if (!first || !last) return

            const active = document.activeElement
            const inTrap = nodes.includes(active as HTMLElement)

            if (event.shiftKey) {
                if (active === first || !inTrap) {
                    event.preventDefault()
                    last.focus()
                }
                return
            }

            if (active !== last && inTrap) {
                return
            }

            event.preventDefault()
            first.focus()
        }

        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    const value = useMemo(() => ({ open, openMenu, closeMenu }), [open, openMenu, closeMenu])

    return <NavMenuContext.Provider value={value}>{children}</NavMenuContext.Provider>
}

export const useNavMenu = (): NavMenuValue => {
    const value = useContext(NavMenuContext)
    if (value === null) {
        throw new Error('useNavMenu must be used within NavMenuProvider')
    }
    return value
}

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
            if (event.key !== 'Escape') return

            event.preventDefault()
            setOpen(false)
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

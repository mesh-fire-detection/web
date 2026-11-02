import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'

import { fetchSession, signOut as requestSignOut, type SessionUser } from '@core/api/auth'

/**
 * `loading` until the API has answered once. The header shows neither "Sign in"
 * nor a name while loading, so a signed-in person never sees the wrong one flash.
 * An unreachable API counts as signed out: the public site must keep working.
 */
export type Session =
    | { readonly status: 'loading' }
    | { readonly status: 'signed_out' }
    | { readonly status: 'signed_in'; readonly user: SessionUser }

type SessionValue = {
    readonly session: Session
    readonly signedIn: (user: SessionUser) => void
    readonly signOut: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

type SessionProviderProperties = {
    readonly children: ReactNode
}

export const SessionProvider = ({ children }: SessionProviderProperties) => {
    const [session, setSession] = useState<Session>({ status: 'loading' })

    useEffect(() => {
        let current = true
        void fetchSession().then((result) => {
            if (!current) return
            setSession(
                result.ok && result.data !== null
                    ? { status: 'signed_in', user: result.data }
                    : { status: 'signed_out' }
            )
        })
        return () => {
            current = false
        }
    }, [])

    const signedIn = useCallback((user: SessionUser) => {
        setSession({ status: 'signed_in', user })
    }, [])

    const signOut = useCallback(async () => {
        await requestSignOut()
        // Signed out locally even if the request failed: the person asked to
        // leave, and a page still showing their name would say otherwise.
        setSession({ status: 'signed_out' })
    }, [])

    const value = useMemo(() => ({ session, signedIn, signOut }), [session, signedIn, signOut])

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = (): SessionValue => {
    const value = useContext(SessionContext)
    if (value === null) {
        throw new Error('useSession must be used within SessionProvider')
    }
    return value
}

import { useEffect, useState } from 'react'

import { useSession } from '@components/app/SessionProvider'
import { fetchNodes } from '@core/api/nodes'

const NONE: ReadonlyMap<string, string> = new Map()

/**
 * Registered node IDs by mesh ID, for linking a node on `/connect` to its own
 * page. Node pages are for members, so nothing is asked for when signed out.
 * Asks again whenever a node this browser has not looked up yet appears.
 */
export function useNodePages(meshIds: readonly string[]): ReadonlyMap<string, string> {
    const { session } = useSession()
    const signedIn = session.status === 'signed_in'
    const [pages, setPages] = useState(NONE)
    const wanted = meshIds.filter((id) => !pages.has(id)).toSorted((a, b) => a.localeCompare(b))
    const key = wanted.join(',')

    useEffect(() => {
        if (!signedIn || key === '') return
        let current = true
        void fetchNodes().then((result) => {
            if (!current || !result.ok) return
            setPages(new Map(result.data.map((node) => [node.meshId, node.id])))
        })
        return () => {
            current = false
        }
    }, [signedIn, key])

    return signedIn ? pages : NONE
}

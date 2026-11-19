import { useEffect } from 'react'

import { backUpConnectedNodes } from '@components/account/nodeBackup'
import { REFRESH_MS } from '@components/app/Live'
import { useRadioSnapshot } from '@components/app/RadioProvider'
import { useSession } from '@components/app/SessionProvider'
import { announceNodeData } from '@core/live/signal'
import { connectedMeshIds } from '@core/nearby/radio'

/**
 * While this tab is connected to a node and someone is signed in, copies what
 * it reports to the server every minute, so `/nodes` and the node's page show
 * it. Pages showing nodes are told when something new arrived. Only nodes on
 * the person's account are copied; the run itself decides that.
 */
export function RadioBackup() {
    const { session } = useSession()
    const signedIn = session.status === 'signed_in'
    const connected = connectedMeshIds(useRadioSnapshot()).size > 0

    useEffect(() => {
        if (!signedIn || !connected) return
        const run = () => {
            void backUpConnectedNodes().then((stored) => {
                if (stored > 0) announceNodeData()
            })
        }
        run()
        const timer = setInterval(run, REFRESH_MS)
        return () => {
            clearInterval(timer)
        }
    }, [signedIn, connected])

    return null
}

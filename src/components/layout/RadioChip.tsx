import { useLocation } from 'react-router-dom'

import { useRadioSnapshot } from '@components/app/RadioProvider'
import { Text } from '@components/shared/typography/Text'
import { ButtonLink } from '@components/shared/widgets/Action'
import { StatusDot } from '@components/shared/widgets/Badge'
import { meshId, nodeName } from '@core/nearby/model'
import type { NearbyNode } from '@core/nearby/model'

function shortName(node: NearbyNode): string {
    return nodeName(node) || (node.nodeNum === null ? node.bluetoothName : meshId(node.nodeNum))
}

/**
 * The node this tab holds a radio connection to, on every page but `/connect`
 * itself, and a way back to it. Nothing when no node is connected.
 */
export function RadioChip() {
    const snapshot = useRadioSnapshot()
    const { pathname } = useLocation()
    if (snapshot === null || pathname === '/connect') return null
    const connected = snapshot.nodes.filter((node) => node.state === 'connected')
    const opening = snapshot.nodes.some(
        (node) => node.state === 'connecting' || node.state === 'initializing'
    )
    const [first] = connected
    if (first === undefined && !opening) return null

    const words =
        first === undefined
            ? 'Connecting'
            : connected.length === 1
              ? shortName(first)
              : `${String(connected.length)} connected`
    return (
        <ButtonLink
            to='/connect'
            variant='ghost'
            size='sm'
            className='header_radio'
            label={
                first === undefined
                    ? 'Connecting to a node. Open Connect a Node'
                    : `Connected to ${connected.map((node) => shortName(node)).join(', ')}. Open Connect a Node`
            }
            iconBefore={<StatusDot kind={first === undefined ? 'warn' : 'live'} pulse />}
        >
            <Text as='span' mono size='xs' uppercase weight={600} truncate tone='inherit'>
                {words}
            </Text>
        </ButtonLink>
    )
}

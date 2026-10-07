import { useState } from 'react'

import { Age, NodeTag } from '@components/pages/build/nearby/Indicators'
import { Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Icon } from '@components/shared/widgets/Icon'
import { nearbyDetailsContent as copy } from '@core/content/build/nearby/deviceDetails'
import { isMfdNode } from '@core/nearby/firmware'
import {
    formatNumber,
    isSensorMetric,
    metricLabel,
    nearestPeers,
    readingValue,
    SIGNAL_TONE,
    signalQuality,
} from '@core/nearby/metrics'
import { deviceName } from '@core/nearby/model'
import type { Device, Peer } from '@core/nearby/model'

const VISIBLE = 5

function Link({ peer }: { readonly peer: Peer }) {
    if (peer.hopsAway === 0 && peer.snr !== null) {
        const quality = signalQuality(peer.snr)
        return (
            <Text size='xs' tone={SIGNAL_TONE[quality]}>
                {copy.quality[quality]} · {formatNumber(peer.snr, 'dB')}
                {peer.rssi === null ? '' : ` · ${formatNumber(peer.rssi, 'dBm')}`}
            </Text>
        )
    }
    const route =
        peer.hopsAway === null
            ? copy.routeUnknown
            : peer.hopsAway === 0
              ? copy.direct
              : `${String(peer.hopsAway)} ${peer.hopsAway === 1 ? copy.hop : copy.hops}`
    return (
        <Text size='xs' tone='muted'>
            {route}
        </Text>
    )
}

function PeerRow({ peer }: { readonly peer: Peer }) {
    const heard = peer.lastPacketAt ?? peer.lastHeardAt
    const name = deviceName({
        name: peer.name || peer.shortName.trim(),
        bluetoothName: '',
        nodeNum: peer.num,
    })
    const battery = peer.readings['deviceMetrics.batteryLevel']
    const values = [
        ...(battery ? [`${metricLabel(battery.metric)} ${readingValue(battery)}`] : []),
        ...Object.values(peer.readings)
            .filter((reading) => isSensorMetric(reading.metric))
            .map((reading) => `${metricLabel(reading.metric)} ${readingValue(reading)}`),
    ]
    return (
        <div className='nearby_peer'>
            <NodeTag num={peer.num} ours={isMfdNode(peer)} size='sm' />
            <Text size='sm' weight={600} className='nearby_peer_name'>
                {name || peer.hardware || copy.unnamedNode}
            </Text>
            <Text size='2xs' tone='faint' className='nearby_peer_meta'>
                {name ? peer.hardware : ''}
                {heard !== null && name && peer.hardware ? ' · ' : null}
                {heard === null ? null : (
                    <span>
                        {copy.lastHeard} <Age time={heard} />
                    </span>
                )}
            </Text>
            <div className='nearby_peer_link'>
                <Icon name='radio' />
                <Link peer={peer} />
            </div>
            {values.length > 0 ? (
                <Text size='xs' tone='muted' className='nearby_peer_readings'>
                    {values.join(' · ')}
                </Text>
            ) : null}
        </div>
    )
}

export function NearbyNodes({ device }: { readonly device: Device }) {
    const [expanded, setExpanded] = useState(false)
    const peers = nearestPeers(device)
    return (
        <Stack gap={3}>
            <Text size='xs' tone='faint'>
                {copy.peersNote}
            </Text>
            {peers.length === 0 ? (
                <Text size='sm' tone='faint'>
                    {copy.noPeers}
                </Text>
            ) : (
                <div className='nearby_peers'>
                    {(expanded ? peers : peers.slice(0, VISIBLE)).map((peer) => (
                        <PeerRow key={peer.num} peer={peer} />
                    ))}
                </div>
            )}
            {peers.length > VISIBLE ? (
                <Button
                    size='sm'
                    variant='ghost'
                    ariaExpanded={expanded}
                    onClick={() => {
                        setExpanded(!expanded)
                    }}
                >
                    {expanded ? copy.showFewer : `${copy.showAll} (${String(peers.length)})`}
                </Button>
            ) : null}
        </Stack>
    )
}

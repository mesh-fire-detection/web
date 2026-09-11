import { Suspense, lazy } from 'react'

import { Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import type { MeshNode } from '@core/content/network/network'

// maplibre is ~1.2 MB. Only the pages that render a map should pay for it.
const NetworkMap = lazy(async () => {
    const module = await import('./NetworkMap')
    return { default: module.NetworkMap }
})

function MapSkeleton({ height }: { height: number }) {
    return (
        <Stack
            className='map map_loading'
            style={{ height }}
            align='center'
            justify='center'
            gap={0}
        >
            <Text as='span' size='2xs' mono uppercase tone='faint'>
                Loading map
            </Text>
        </Stack>
    )
}

export function LazyNetworkMap({
    selectedId,
    onSelect,
    height = 520,
}: {
    selectedId: string | null
    onSelect: (node: MeshNode | null) => void
    height?: number
}) {
    return (
        <Suspense fallback={<MapSkeleton height={height} />}>
            <NetworkMap selectedId={selectedId} onSelect={onSelect} height={height} />
        </Suspense>
    )
}

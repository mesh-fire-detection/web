import type { FeatureCollection, LineString, Point } from 'geojson'

import { findNode, linkQuality, LINKS, NODES } from '@core/content/network/network'
import type { MeshNode } from '@core/content/network/network'

export type NodeFeatureProps = {
    id: string
    name: string
    type: MeshNode['type']
    status: MeshNode['status']
    radius: number
}

const RADIUS_BY_TYPE: Record<MeshNode['type'], number> = {
    cellular: 9,
    base: 7.5,
    vision: 6,
    sensor: 5,
}

export function nodesToGeoJson(): FeatureCollection<Point, NodeFeatureProps> {
    return {
        type: 'FeatureCollection',
        features: NODES.map((node) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: node.position },
            properties: {
                id: node.id,
                name: node.name,
                type: node.type,
                status: node.status,
                radius: RADIUS_BY_TYPE[node.type],
            },
        })),
    }
}

export type LinkFeatureProps = {
    quality: 'good' | 'marginal' | 'bad'
    snr: number
    rssi: number
    dashed: boolean
}

export function linksToGeoJson(): FeatureCollection<LineString, LinkFeatureProps> {
    const features = LINKS.flatMap((link) => {
        const from = findNode(link.from)
        const to = findNode(link.to)
        if (!from || !to) return []

        const quality = linkQuality(link.snr)
        // A link is only real if both ends are up.
        const live = from.status !== 'offline' && to.status !== 'offline'

        return [
            {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [from.position, to.position],
                },
                properties: {
                    quality,
                    snr: link.snr,
                    rssi: link.rssi,
                    dashed: !live || quality === 'bad',
                },
            },
        ]
    })

    return { type: 'FeatureCollection', features }
}

/** Bounding box of every node, as [west, south, east, north]. */
export function networkBounds(): [number, number, number, number] {
    const lons = NODES.map((node) => node.position[0])
    const lats = NODES.map((node) => node.position[1])
    return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]
}

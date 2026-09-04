import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Canvas } from '@/ui'
import { findNode } from '@/data/network'
import type { MeshNode } from '@/data/network'
import { linksToGeoJson, networkBounds, nodesToGeoJson } from '@/lib/mapGeo'
import { BASEMAP_STYLE, LINK_COLORS, NODE_COLORS } from '@/lib/mapStyle'

const NODES_SOURCE = 'mesh-nodes'
const LINKS_SOURCE = 'mesh-links'

export function NetworkMap({
  selectedId,
  onSelect,
  height = 520,
}: {
  selectedId: string | null
  onSelect: (node: MeshNode | null) => void
  height?: number | undefined
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const [failed, setFailed] = useState(false)

  // Keep the latest callback without re-creating the map.
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // maplibre-gl v5 throws on construction without WebGL rather than exposing
    // a support check, so the guard is a try/catch around the whole setup.
    let map: maplibregl.Map
    try {
      const [west, south, east, north] = networkBounds()
      map = new maplibregl.Map({
        container,
        style: BASEMAP_STYLE,
        bounds: [west, south, east, north],
        fitBoundsOptions: { padding: 72 },
        attributionControl: false,
        dragRotate: false,
        maxZoom: 15,
      })
    } catch {
      setFailed(true)
      return
    }
    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: 'Mesh Fire Detection · node positions from the network feed',
      }),
      'bottom-right',
    )

    map.on('error', () => setFailed(true))

    map.on('load', () => {
      map.addSource(LINKS_SOURCE, { type: 'geojson', data: linksToGeoJson() })
      map.addSource(NODES_SOURCE, { type: 'geojson', data: nodesToGeoJson() })

      map.addLayer({
        id: 'links',
        type: 'line',
        source: LINKS_SOURCE,
        layout: { 'line-cap': 'round' },
        paint: {
          'line-width': ['case', ['get', 'dashed'], 1, 1.8],
          'line-opacity': ['case', ['get', 'dashed'], 0.35, 0.7],
          'line-color': [
            'match',
            ['get', 'quality'],
            'good',
            LINK_COLORS.good,
            'marginal',
            LINK_COLORS.marginal,
            LINK_COLORS.bad,
          ],
          'line-dasharray': [2, 2],
        },
      })

      // Solid overlay for healthy links; the dashed layer below shows through
      // wherever a link is degraded or one end is down.
      map.addLayer({
        id: 'links-solid',
        type: 'line',
        source: LINKS_SOURCE,
        filter: ['!', ['get', 'dashed']],
        layout: { 'line-cap': 'round' },
        paint: {
          'line-width': 1.8,
          'line-opacity': 0.75,
          'line-color': [
            'match',
            ['get', 'quality'],
            'good',
            LINK_COLORS.good,
            LINK_COLORS.marginal,
          ],
        },
      })

      map.addLayer({
        id: 'nodes-halo',
        type: 'circle',
        source: NODES_SOURCE,
        paint: {
          'circle-radius': ['+', ['get', 'radius'], 9],
          'circle-color': [
            'match',
            ['get', 'status'],
            'online',
            NODE_COLORS.online,
            'degraded',
            NODE_COLORS.degraded,
            NODE_COLORS.offline,
          ],
          'circle-opacity': 0.12,
        },
      })

      map.addLayer({
        id: 'nodes',
        type: 'circle',
        source: NODES_SOURCE,
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': [
            'match',
            ['get', 'status'],
            'online',
            NODE_COLORS.online,
            'degraded',
            NODE_COLORS.degraded,
            NODE_COLORS.offline,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#070a09',
          // Cellular nodes are the branch head; give them a filled centre.
          'circle-opacity': ['case', ['==', ['get', 'type'], 'sensor'], 0.85, 1],
        },
      })

      map.addLayer({
        id: 'nodes-selected',
        type: 'circle',
        source: NODES_SOURCE,
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': ['+', ['get', 'radius'], 6],
          'circle-color': 'transparent',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ff6b35',
        },
      })

      map.on('click', 'nodes', (event) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined
        const id = feature?.properties?.['id']
        if (typeof id === 'string') onSelectRef.current(findNode(id) ?? null)
      })

      map.on('click', (event) => {
        const hits = map.queryRenderedFeatures(event.point, { layers: ['nodes'] })
        if (hits.length === 0) onSelectRef.current(null)
      })

      map.on('mouseenter', 'nodes', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'nodes', () => {
        map.getCanvas().style.cursor = ''
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Highlight ring and camera follow the selection made anywhere on the page.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const apply = () => {
      if (!map.getLayer('nodes-selected')) return
      map.setFilter('nodes-selected', ['==', ['get', 'id'], selectedId ?? ''])
      const node = selectedId ? findNode(selectedId) : undefined
      if (node) map.easeTo({ center: node.position, duration: 600, padding: { bottom: 40 } })
    }

    if (map.isStyleLoaded()) apply()
    else map.once('load', apply)
  }, [selectedId])

  if (failed) {
    return <Canvas className="map map--failed" style={{ height }} role="img" ariaLabel="Network map unavailable" />
  }

  return (
    <Canvas
      ref={containerRef}
      className="map"
      style={{ height }}
      role="application"
      ariaLabel="Live network map"
    />
  )
}

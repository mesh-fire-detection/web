import type { StyleSpecification } from 'maplibre-gl'

/**
 * A blank dark canvas. No tile requests, no API key, no bill — which is the
 * point. Drop a Protomaps or MapTiler style URL into VITE_BASEMAP_STYLE and the
 * nodes render on top of it instead.
 */
export const BLANK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'canvas',
      type: 'background',
      paint: { 'background-color': '#070a09' },
    },
  ],
}

const configured = import.meta.env['VITE_BASEMAP_STYLE'] as string | undefined

export const BASEMAP_STYLE: string | StyleSpecification = configured ?? BLANK_STYLE
export const HAS_BASEMAP = typeof BASEMAP_STYLE === 'string'

export const NODE_COLORS = {
  online: '#4ade80',
  degraded: '#fbbf24',
  offline: '#f4574f',
} as const

export const LINK_COLORS = {
  good: '#4ade80',
  marginal: '#fbbf24',
  bad: '#f4574f',
} as const

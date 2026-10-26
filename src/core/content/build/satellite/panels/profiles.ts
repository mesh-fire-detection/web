import type { SatelliteProfileTableContent } from '@core/content/types'

export const satelliteProfileContent = {
    title: 'Profiles and reception statistics',
    empty: 'Connect a supported receiver and request its profile and statistics lists.',
    fields: {
        profile: 'Profile',
        satellite: 'Satellite',
        frequency: 'Frequency',
        mode: 'LoRa',
        confidence: 'Source',
        packets: 'Packets',
        crc: 'CRC errors',
        cad: 'CAD hits',
        falseCad: 'False hits',
        last: 'Last packet',
    },
} as const satisfies SatelliteProfileTableContent

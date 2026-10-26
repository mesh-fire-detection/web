import type { SatelliteRangeResultsContent } from '@core/content/types'

export const satelliteRangeResultsContent = {
    title: 'Range Scan results',
    empty: 'Start a Range Scan to collect CAD detections and decoded packets.',
    sortOrder: 'Sorted by decoded packets, CAD hits, then best RSSI.',
    fields: {
        frequency: 'Frequency',
        bandwidth: 'Bandwidth',
        spreadingFactor: 'Spreading factor',
        cadHits: 'CAD hits',
        packets: 'Decoded packets',
        timeouts: 'RX timeouts',
        crcErrors: 'CRC errors',
        errors: 'Other errors',
        bestRssi: 'Best RSSI',
        lastRssi: 'Last RSSI',
    },
} as const satisfies SatelliteRangeResultsContent

import type { SatellitePassListContent } from '@core/content/types'

export const satellitePassContent = {
    title: 'Predicted passes',
    empty: 'No predicted passes yet. Auto mode needs a saved station location and TLEs newer than 30 days.',
    computing: 'Updating the 24-hour pass schedule…',
    fields: {
        satellite: 'Satellite',
        aos: 'AOS',
        tca: 'TCA',
        los: 'LOS',
        maximumElevation: 'Max elevation',
        tleAge: 'TLE age',
        stale: 'Stale TLE',
    },
    selected: 'Selected now',
    minutes: 'days',
} as const satisfies SatellitePassListContent

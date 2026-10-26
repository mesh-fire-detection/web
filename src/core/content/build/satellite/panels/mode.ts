import type { SatelliteModePanelContent } from '@core/content/types'

export const satelliteModeContent = {
    title: 'Receive mode',
    modes: { auto: 'Auto', fixed: 'Fixed', scan: 'Profile scan', range: 'Range scan' },
    profile: 'Satellite profile',
    range: {
        start: 'Start frequency',
        end: 'End frequency',
        bandwidth: 'Bandwidths',
        sf: 'Spreading factors',
        cad: 'CAD symbols',
        timeout: 'RX timeout',
    },
    start: 'Start range scan',
    estimate: '{count} combinations · about {duration} per cycle',
    manualWarning: 'A manual mode pauses automatic pass tracking. Select Auto to resume it.',
    unsupported:
        'Connect a station running firmware-satellite 0.0.1 or newer to change receive modes.',
    cadDetected: 'CAD detected',
    decoded: 'Packet decoded',
    identified: 'Satellite identified',
    stageStatus: {
        observed: 'Observed',
        notYet: 'Not yet',
        unconfirmed: 'Unconfirmed',
    },
    identificationNote:
        'A valid LoRa packet and a matching radio profile do not identify its satellite. Payload protocol decoding is not available yet.',
    commandFailed: 'Could not send the mode command. Check the station connection and try again.',
} as const satisfies SatelliteModePanelContent

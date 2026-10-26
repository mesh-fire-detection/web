import type { SatellitePacketListContent } from '@core/content/types'

export const packetListContent = {
    emptyPackets:
        'No packets yet. They appear here as soon as the station decodes a LoRa transmission.',
    emptyRecords: 'No records yet. The station sends a heartbeat every 30 seconds.',
    status: { ok: 'Decoded', damaged: 'Damaged (CRC)', error: 'Error' },
    replayed: 'from station flash',
    fields: {
        rssi: 'RSSI',
        snr: 'SNR',
        offset: 'Offset',
        length: 'Length',
        profile: 'Profile',
        mode: 'Mode',
        satellite: 'Satellite',
        doppler: 'Predicted Doppler',
    },
    payload: 'Payload',
    emptyPayload: 'Empty payload',
    unknownTime: 'time unknown',
    boot: 'boot',
    showJson: 'Show JSON',
    hideJson: 'Hide JSON',
    summary: {
        noise: 'noise',
        ok: 'ok',
        crc: 'crc',
        radio: 'radio',
        replayed: 'packets replayed',
    },
} as const satisfies SatellitePacketListContent

import type { SatelliteReceiverContent } from '@core/content/types'

export const satelliteContent = {
    title: 'Satellite Receiver',
    eyebrow: 'Build · Experimental',
    lede: 'Watch what the LoRa satellite receiver hears across 435–438 MHz. Connect the station over Bluetooth or USB to manage receive modes and read records as they arrive.',
    connect: { bluetooth: 'Connect over Bluetooth', usb: 'Connect over USB' },
    transports: { bluetooth: 'Bluetooth', usb: 'USB' },
    helper: [
        'The station runs firmware-satellite, not Meshtastic, and appears in the Bluetooth list as MFDR_ followed by its four-character ID.',
        'Packets remain in station flash across restarts. New packets play a short tone; download JSONL to keep a local record.',
        'The page sends time on connect. Auto tracking also needs your station location and recent TLE data.',
    ],
    support: {
        insecure: 'HTTPS only',
        unsupported: 'Chrome or Edge only',
    },
    states: {
        idle: 'Not connected',
        connecting: 'Connecting…',
        connected: 'Connected',
    },
    errors: {
        failed: 'Check that the station is powered, nearby, and running the satellite receiver firmware, then try again.',
        closed: 'The station disconnected. Records received so far stay on this page.',
    },
    errorTitle: 'Station unavailable',
    summaryTitle: 'Station',
    summary: {
        radio: 'Radio',
        listening: 'Listening',
        fault: 'Fault, code',
        frequency: 'Frequency',
        packets: 'Decoded packets',
        damaged: 'Damaged packets',
        stored: 'Stored on station',
        noise: 'Noise floor',
        mode: 'Mode',
        profile: 'Profile',
        lastHeartbeat: 'Last heartbeat',
        notYet: 'Not yet',
    },
    views: { packets: 'Packets', records: 'All records' },
    actions: {
        disconnect: 'Disconnect',
        status: 'Refresh status',
        history: 'Reload history',
        download: 'Download JSONL',
        clear: 'Clear page',
    },
    compatibility: 'Mode and tracking controls require firmware-satellite 0.0.1 or newer.',
    txBuildTitle: 'TX-capable build',
    txBuild:
        'The compile-time TX flag is enabled. No satellite profile is approved for uplink, so this firmware remains receive-only.',
} as const satisfies SatelliteReceiverContent

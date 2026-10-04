import type { NearbyDevicesContent } from '@core/content/types'

export const nearbyDevicesContent = {
    title: 'Nearby Devices',
    eyebrow: 'Build · Check your nodes',
    lede: 'Connect your nodes over Bluetooth to check their identity, settings, and sensor readings before deployment.',
    add: 'Add device',
    helper: 'Choose each device in your browser’s Bluetooth dialog. Only devices you add appear here.',
    sessionNote:
        'One active connection at a time. Recent devices stay visible for 10 minutes after connecting. The latest readings and voltage history are kept in this browser.',
    recentStatus: 'Recently connected',
    emptyTitle: 'No devices added yet',
    emptyBody: 'Power on a node and select Add device.',
    devicesTitle: 'Your devices',
    unnamed: 'Unnamed device',
    errorTitle: 'Connection failed',
    battery: 'Battery',
    lastPacket: 'Last packet',
    notReported: 'Not reported',
    previousTitle: 'Previously added',
    previousBody:
        'Reconnect a saved device to receive current data. Select a device to see what was received in this page session.',
    restoration: {
        checking: 'Checking previously allowed devices…',
        unsupported:
            'This browser requires you to select the device again after a reload. Use Reconnect below.',
        failed: 'Could not restore device access. Use Reconnect below to try again.',
    },
    unsupportedTitle: 'Bluetooth connection unavailable',
    support: {
        insecure:
            'Open this page over HTTPS, or localhost during development, to connect to a device.',
        unsupported:
            'Web Bluetooth is unavailable in this browser. Open this page in desktop Chrome on a computer with Bluetooth.',
    },
    errors: {
        permission:
            'Browser or system pairing did not complete. Check Bluetooth permissions and try again.',
        unsupported:
            'The Meshtastic Bluetooth service is unavailable. Check the device and its firmware, then try again.',
        timeout:
            'The device did not finish connecting within 30 seconds. Check power, distance, and whether another app is connected, then try again.',
        connection:
            'Could not connect to the device. Check power, distance, and whether another phone or app is connected, then try again.',
    },
    hints: {
        connected: 'Receiving live data.',
        connecting: 'Keep the device powered and nearby.',
        initializing: 'Loading identity and settings.',
        recent: 'Not connected. Reconnect for live data.',
        disconnected: 'Saved. Reconnect for live data.',
    },
    states: {
        disconnected: 'Disconnected',
        connecting: 'Connecting…',
        initializing: 'Reading device info…',
        connected: 'Connected',
    },
    actions: {
        view: 'View details',
        connect: 'Reconnect',
        disconnect: 'Disconnect',
        remove: 'Remove from list',
    },
} as const satisfies NearbyDevicesContent

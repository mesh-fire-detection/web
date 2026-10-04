import type { NearbyDevicesContent } from '@core/content/types'

export const nearbyDevicesContent = {
    title: 'Connect a Node',
    eyebrow: 'Build · Check your nodes',
    lede: 'Connect nodes over Bluetooth or USB to check their identity, settings, and sensor readings before deployment.',
    add: { bluetooth: 'Add Bluetooth device', usb: 'Add USB device' },
    transports: { bluetooth: 'Bluetooth', usb: 'USB' },
    helper: [
        'Choose each device in your browser’s Bluetooth or USB dialog. One device is connected at a time.',
        'A USB session turns the node’s Bluetooth advertising off. Disconnect USB first so the node can appear in the browser’s Bluetooth list again.',
    ],
    recentStatus: 'Recently connected',
    emptyTitle: 'No devices added yet',
    emptyBody: 'Power on a node, or plug it in over USB, and choose Bluetooth or USB above.',
    devicesTitle: 'Your devices',
    unnamed: 'Unnamed device',
    errorTitle: 'Connection failed',
    battery: 'Battery',
    externalPower: 'external power',
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
    /** Shown under a disabled connection button. */
    support: {
        insecure: 'HTTPS only',
        unsupported: 'Chrome or Edge only',
    },
    /** Replaces the per-button reasons when neither connection works in this browser. */
    noSupport: {
        title: 'This browser cannot connect to nodes',
        insecure:
            'Bluetooth and USB connections need a secure (HTTPS) page. Open this site over HTTPS.',
        unsupported:
            'Bluetooth and USB connections need Web Bluetooth or Web Serial. Open this page in desktop Chrome or Edge.',
        link: 'Browser support',
        href: 'https://developer.chrome.com/docs/capabilities/bluetooth',
    },
    /** Why Reconnect is disabled on a saved card. */
    unavailable: {
        bluetooth: 'Bluetooth is not available in this browser.',
        usb: 'USB is not available in this browser.',
    },
    /** Read out by screen readers; `removed` also leads the visible undo line. */
    announcements: {
        connecting: 'Connecting',
        connected: 'Connected',
        disconnected: 'Disconnected',
        failed: 'Connection failed',
        removed: 'Removed',
        restored: 'Restored',
    },
    errors: {
        adapter:
            'Bluetooth is off or unavailable to this browser. Turn Bluetooth on and allow the browser to use it in system settings, or connect over USB.',
        permission:
            'Browser or system permission was not granted. Check Bluetooth or USB permissions and try again.',
        unsupported:
            'The device does not offer the Meshtastic connection. Check the device and its firmware, then try again.',
        timeout:
            'The device did not finish connecting within 30 seconds. Check power, distance, and whether another app is connected, then try again.',
        connection:
            'Could not connect to the device. Check power, distance or the cable, and whether another phone or app is connected, then try again.',
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
        undo: 'Undo',
    },
} as const satisfies NearbyDevicesContent

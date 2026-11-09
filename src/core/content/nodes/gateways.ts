import type { GatewaysContent } from '@core/content/types'

export const gatewaysContent = {
    title: 'How Data Gets In',
    lede: 'A sensor’s reading takes one of three paths to the server. When data stops arriving, follow its path to find the link that broke.',
    paths: [
        {
            id: 'mqtt',
            title: 'Wi-Fi gateway',
            via: 'MQTT',
            route: ['Sensor', 'LoRa mesh', 'Gateway on Wi-Fi or Ethernet', 'MQTT broker', 'Server'],
            when: 'Where a gateway can reach the internet over Wi-Fi or a cable.',
            needs: [
                'The gateway registered by an admin, with its own MQTT login',
                'Our private channel key on the gateway and every sensor',
                'Uplink on the private channel only, and “OK to MQTT” on the sensors',
                'The gateway on the CLIENT role with power saving off, so it always listens',
            ],
        },
        {
            id: 'notecard',
            title: 'Notecard gateway',
            via: 'Notecard',
            route: ['Sensor', 'LoRa mesh', 'Gateway', 'Notecard', 'Notehub', 'Server'],
            when: 'Away from Wi-Fi. A Notecard uses cellular, Wi-Fi or satellite, depending on its model and what is in range.',
            needs: [
                'The Notecard’s UID registered on the gateway, with its own route token',
                'A Notehub HTTPS route to the server, sending Authorization: Bearer and the token',
                'The Notecard bridge enabled in the gateway’s firmware',
                'A battery sized for the modem: a weak one silently stops the Notecard for up to an hour',
            ],
        },
        {
            id: 'browser',
            title: 'Your browser',
            via: 'USB or Bluetooth',
            route: ['Node', 'USB or Bluetooth', 'Connect a Node', 'Server'],
            when: 'Readings a node stored while it couldn’t reach a gateway, collected by visiting it.',
            needs: [
                'Being one of the node’s people, signed in',
                'Opening Connect a Node in Chrome or Edge, beside the node',
                'Readings collected this way arrive late, so they are kept as history and never raise an alert',
            ],
        },
    ],
    routeLabel: 'Path',
    whenLabel: 'When',
    needsLabel: 'What it needs',
    live: {
        title: 'Gateways now',
        lede: 'When each gateway last delivered, and over which path. A gateway that delivers nothing for two hours is shown as silent.',
        signIn: 'Sign in to see live gateway status',
        loading: 'Loading gateways…',
        failed: {
            title: 'Gateway status could not be loaded',
            body: 'Check your connection and try again.',
        },
        none: {
            title: 'No gateways yet',
            body: 'An admin registers a gateway once its node is on the network.',
        },
        broker: 'Server’s MQTT connection',
        brokerStates: { connected: 'Connected', disconnected: 'Disconnected', disabled: 'Off' },
        caption: 'Registered gateways and their latest deliveries.',
        columns: {
            gateway: 'Gateway',
            paths: 'Paths',
            last: 'Last delivery',
            refused: 'Refused (24 h)',
        },
        disabled: 'Disabled',
        never: 'never',
        states: { live: 'Delivering', warn: 'Quiet', dead: 'Silent', neutral: 'Never delivered' },
    },
} as const satisfies GatewaysContent

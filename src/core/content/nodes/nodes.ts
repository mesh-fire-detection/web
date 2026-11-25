import type { NodesContent } from '@core/content/types'

export const nodesContent = {
    title: 'Nodes',
    lede: 'Every registered node. Positions are shown to within about a kilometre, except on your own nodes and where a node’s people chose to show it exactly.',
    loading: 'Loading nodes…',
    failed: {
        title: 'The node list could not be loaded',
        body: 'Check your connection and try again.',
    },
    filters: {
        label: 'Search and filter nodes',
        show: 'Show',
        all: 'All',
        mine: 'Yours',
        role: 'Role',
        anyRole: 'All roles',
        status: 'Status',
        anyStatus: 'All statuses',
        search: 'Search nodes',
        searchPlaceholder: 'ID or name',
        submit: 'Search',
    },
    types: { base: 'Base', cellular: 'Cellular', sensor: 'Sensor', vision: 'Vision' },
    roles: { base: 'Base', gateway: 'Gateway', sensor: 'Sensor', vision: 'Vision' },
    connections: {
        via: {
            mesh: 'Mesh',
            mqtt: 'MQTT',
            notecard: 'Notecard',
            browser: 'Browser (USB or Bluetooth)',
        },
        network: { wifi: 'Wi-Fi', cellular: 'Cellular', satellite: 'Satellite' },
        never: 'not used yet',
    },
    statuses: { online: 'Online', late: 'Late', offline: 'Offline' },
    table: {
        caption: 'Registered nodes. Select a column heading to sort.',
        node: 'Node',
        role: 'Role',
        status: 'Status',
        power: 'Power',
        heard: 'Last heard',
    },
    /** What powers a node, and the path it was last heard by beside its status. */
    power: {
        plugged: 'Plugged in',
        charging: 'Charging',
        low: 'Battery low',
        none: 'No battery',
        via: 'via',
        lastVia: 'last via',
        browser: 'browser',
    },
    /** The power source its people may set: for boards that cannot tell USB is connected. */
    sources: {
        label: 'Power source',
        hint: 'Choose Always plugged in for a node on USB or mains whose board cannot tell, so a worn-out battery is not reported as low.',
        battery: 'Battery',
        solar: 'Solar and battery',
        mains: 'Always plugged in (USB or mains)',
    },
    yours: 'Yours',
    disabled: 'Disabled',
    connectedHere: 'Connected here',
    updated: 'Updated',
    noPosition: 'No position yet',
    viewOnMap: 'View these nodes on the map',
    approximately: 'about',
    empty: {
        none: {
            title: 'No nodes registered yet',
            body: 'Connect a node, then add it to your account from that page to register it.',
        },
        noneMine: {
            title: 'None of yours yet',
            body: 'Connect a node, then add it to your account from that page.',
        },
        noResults: {
            title: 'No nodes match these filters',
            body: 'Change the search or filters to see more nodes.',
        },
        connect: 'Connect a Node',
        clear: 'Clear filters',
    },
} as const satisfies NodesContent

import type { Node } from '@core/api/nodes'

/** When the tests' nodes were last heard from, relative to now. */
export const minutesAgo = (minutes: number): string =>
    new Date(Date.now() - minutes * 60_000).toISOString()

/** A node someone else is on, as any member sees it: approximate, no details. */
export const RIDGE: Node = {
    id: 'sen-01',
    meshId: '!a1b2c3d4',
    name: 'Ridge sensor',
    type: 'sensor',
    status: 'online',
    position: [-121.7695, 47.4365],
    approximate: true,
    elevationM: 550,
    antennaHeightM: 4,
    firmware: '2.7.15',
    deployedOn: '2026-05-20',
    batteryPct: 88,
    lastHeardAt: minutesAgo(3),
    enabled: true,
    mine: false,
    details: null,
}

/** A node the caller is on, so its details come with it. */
export const BENCH: Node = {
    id: 'n-0001',
    meshId: '!12345678',
    name: 'Bench node',
    type: null,
    status: 'offline',
    position: [-121.7861, 47.4402],
    approximate: false,
    elevationM: 187,
    antennaHeightM: null,
    firmware: null,
    deployedOn: null,
    batteryPct: null,
    lastHeardAt: null,
    enabled: true,
    mine: true,
    details: {
        position: [-121.7861, 47.4402],
        elevationM: 187,
        exactPosition: false,
        hardware: 'RAK4631',
        hardwareId: '0a1b2c3d4e5f6a7b',
        note: 'On the shelf above the bench.',
        owners: [
            { name: 'Ada Lovelace', addedAt: '2026-10-29T12:00:00.000Z', you: true },
            { name: 'Grace Hopper', addedAt: '2026-10-30T12:00:00.000Z', you: false },
        ],
        reported: null,
        createdAt: '2026-10-29T12:00:00.000Z',
        updatedAt: '2026-10-29T12:00:00.000Z',
    },
}

export const GATE: Node = {
    ...RIDGE,
    id: 'cel-01',
    meshId: '!0000c001',
    name: 'Truck Road Gate',
    type: 'cellular',
    status: 'degraded',
    batteryPct: 41,
    lastHeardAt: minutesAgo(90),
}

/**
 * Network state.
 *
 * `SOURCE` is deliberately explicit. Everything in this file is seed data
 * shaped exactly like the real feed, so that swapping in a live endpoint is a
 * one-line change and nothing on the site silently starts lying.
 */
export type NodeType = 'base' | 'cellular' | 'sensor' | 'vision'
export type NodeStatus = 'online' | 'degraded' | 'offline'

export interface MeshNode {
  id: string
  name: string
  type: NodeType
  status: NodeStatus
  /** [longitude, latitude] — GeoJSON order. */
  position: [number, number]
  /** Metres above sea level. */
  elevationM: number
  /** Metres above ground the antenna sits. */
  antennaHeightM: number
  /** 0–100, null when the node has never reported. */
  batteryPct: number | null
  /** Minutes since the last packet. */
  lastHeartbeatMin: number | null
  firmware: string
  deployedOn: string
  note?: string
}

export interface MeshLink {
  from: string
  to: string
  /** dBm at the receiving end. */
  rssi: number
  /** dB. Below about -10 the link is unusable on LoRa. */
  snr: number
  distanceKm: number
}

export const SOURCE = {
  kind: 'sample' as 'sample' | 'live',
  label: 'Sample data — no nodes deployed yet',
  detail:
    'These are the fourteen nodes of the planned Rattlesnake Ridge branch, shaped exactly like the live feed will be. Nothing here has been in the field. When the first node reports, this banner disappears and the numbers become real.',
  endpoint: '/api/network.json',
}

export const NODES: readonly MeshNode[] = [
  {
    id: 'cel-01',
    name: 'Truck Road Gate',
    type: 'cellular',
    status: 'online',
    position: [-121.7861, 47.4402],
    elevationM: 187,
    antennaHeightM: 4,
    batteryPct: 96,
    lastHeartbeatMin: 2,
    firmware: '2.5.9',
    deployedOn: '2026-04-12',
    note: 'Branch uplink. LTE backhaul, mains power at the gatehouse.',
  },
  {
    id: 'bas-01',
    name: 'Cedar Butte',
    type: 'base',
    status: 'online',
    position: [-121.7644, 47.4318],
    elevationM: 543,
    antennaHeightM: 8,
    batteryPct: 91,
    lastHeartbeatMin: 3,
    firmware: '2.5.9',
    deployedOn: '2026-04-12',
  },
  {
    id: 'sen-01',
    name: 'Cedar Butte North',
    type: 'sensor',
    status: 'online',
    position: [-121.7702, 47.4361],
    elevationM: 498,
    antennaHeightM: 2,
    batteryPct: 88,
    lastHeartbeatMin: 6,
    firmware: '2.5.9',
    deployedOn: '2026-04-19',
  },
  {
    id: 'bas-02',
    name: 'Rattlesnake Ledge',
    type: 'base',
    status: 'online',
    position: [-121.7489, 47.4194],
    elevationM: 692,
    antennaHeightM: 9,
    batteryPct: 84,
    lastHeartbeatMin: 4,
    firmware: '2.5.9',
    deployedOn: '2026-04-19',
  },
  {
    id: 'vis-01',
    name: 'Ledge Overlook',
    type: 'vision',
    status: 'online',
    position: [-121.7461, 47.4177],
    elevationM: 701,
    antennaHeightM: 3,
    batteryPct: 62,
    lastHeartbeatMin: 11,
    firmware: '2.5.9-vis',
    deployedOn: '2026-05-02',
    note: 'Faces 210°, covers the valley floor to Snoqualmie.',
  },
  {
    id: 'bas-03',
    name: 'Grand Prospect',
    type: 'base',
    status: 'degraded',
    position: [-121.7218, 47.4076],
    elevationM: 811,
    antennaHeightM: 8,
    batteryPct: 34,
    lastHeartbeatMin: 47,
    firmware: '2.5.7',
    deployedOn: '2026-05-02',
    note: 'Panel partly shaded after leaf-out. Needs a remount.',
  },
  {
    id: 'sen-02',
    name: 'Prospect Draw',
    type: 'sensor',
    status: 'online',
    position: [-121.7256, 47.4041],
    elevationM: 764,
    antennaHeightM: 2,
    batteryPct: 79,
    lastHeartbeatMin: 8,
    firmware: '2.5.9',
    deployedOn: '2026-05-02',
  },
  {
    id: 'sen-03',
    name: 'Prospect East',
    type: 'sensor',
    status: 'offline',
    position: [-121.7147, 47.4092],
    elevationM: 798,
    antennaHeightM: 2,
    batteryPct: 4,
    lastHeartbeatMin: 3271,
    firmware: '2.5.7',
    deployedOn: '2026-05-02',
    note: 'Dead since 2026-08-21. Suspected battery protection cutout.',
  },
  {
    id: 'bas-04',
    name: 'East Peak',
    type: 'base',
    status: 'online',
    position: [-121.6944, 47.3982],
    elevationM: 943,
    antennaHeightM: 10,
    batteryPct: 93,
    lastHeartbeatMin: 5,
    firmware: '2.5.9',
    deployedOn: '2026-05-24',
  },
  {
    id: 'vis-02',
    name: 'East Peak Cam',
    type: 'vision',
    status: 'online',
    position: [-121.6931, 47.3971],
    elevationM: 941,
    antennaHeightM: 3,
    batteryPct: 58,
    lastHeartbeatMin: 14,
    firmware: '2.5.9-vis',
    deployedOn: '2026-05-24',
    note: 'Faces 145°, covers the upper Cedar River drainage.',
  },
  {
    id: 'bas-05',
    name: 'Christmas Ridge',
    type: 'base',
    status: 'online',
    position: [-121.6621, 47.3874],
    elevationM: 1012,
    antennaHeightM: 8,
    batteryPct: 87,
    lastHeartbeatMin: 7,
    firmware: '2.5.9',
    deployedOn: '2026-06-14',
  },
  {
    id: 'sen-04',
    name: 'Christmas Saddle',
    type: 'sensor',
    status: 'online',
    position: [-121.6659, 47.3831],
    elevationM: 967,
    antennaHeightM: 2,
    batteryPct: 81,
    lastHeartbeatMin: 9,
    firmware: '2.5.9',
    deployedOn: '2026-06-14',
  },
  {
    id: 'bas-06',
    name: 'Mailbox Spur',
    type: 'base',
    status: 'offline',
    position: [-121.6349, 47.3752],
    elevationM: 1088,
    antennaHeightM: 8,
    batteryPct: null,
    lastHeartbeatMin: null,
    firmware: '2.5.9',
    deployedOn: '2026-07-05',
    note: 'Never reported after install. Physical recovery scheduled.',
  },
  {
    id: 'sen-05',
    name: 'Mailbox Bowl',
    type: 'sensor',
    status: 'offline',
    position: [-121.6392, 47.3711],
    elevationM: 1041,
    antennaHeightM: 2,
    batteryPct: null,
    lastHeartbeatMin: null,
    firmware: '2.5.9',
    deployedOn: '2026-07-05',
    note: 'Orphaned — its only parent, Mailbox Spur, is down.',
  },
]

export const LINKS: readonly MeshLink[] = [
  { from: 'cel-01', to: 'bas-01', rssi: -91, snr: 8.5, distanceKm: 1.8 },
  { from: 'bas-01', to: 'sen-01', rssi: -98, snr: 6.2, distanceKm: 0.7 },
  { from: 'bas-01', to: 'bas-02', rssi: -104, snr: 4.1, distanceKm: 2.0 },
  { from: 'bas-02', to: 'vis-01', rssi: -87, snr: 10.4, distanceKm: 0.3 },
  { from: 'bas-02', to: 'bas-03', rssi: -112, snr: -2.5, distanceKm: 2.4 },
  { from: 'bas-01', to: 'bas-03', rssi: -118, snr: -7.8, distanceKm: 4.3 },
  { from: 'bas-03', to: 'sen-02', rssi: -101, snr: 5.6, distanceKm: 0.5 },
  { from: 'bas-03', to: 'bas-04', rssi: -108, snr: 1.2, distanceKm: 2.4 },
  { from: 'bas-02', to: 'bas-04', rssi: -119, snr: -8.4, distanceKm: 4.7 },
  { from: 'bas-04', to: 'vis-02', rssi: -84, snr: 11.8, distanceKm: 0.2 },
  { from: 'bas-04', to: 'bas-05', rssi: -103, snr: 4.9, distanceKm: 2.5 },
  { from: 'bas-05', to: 'sen-04', rssi: -96, snr: 7.1, distanceKm: 0.5 },
  { from: 'bas-03', to: 'bas-05', rssi: -117, snr: -6.9, distanceKm: 4.9 },
]

export interface NodeTypeSpec {
  type: NodeType
  name: string
  role: string
  detail: string
  unitCost: number
  icon: 'radio' | 'cell' | 'sensor' | 'camera'
}

export const NODE_TYPES: readonly NodeTypeSpec[] = [
  {
    type: 'base',
    name: 'Base',
    role: 'Carries the mesh',
    detail:
      'The core relay. Strongest LoRa signal in the network, mounted as high as the site allows. Every other node type talks through one.',
    unitCost: 70,
    icon: 'radio',
  },
  {
    type: 'cellular',
    name: 'Cellular',
    role: 'Reaches the internet',
    detail:
      'Sits at the head of a branch and forwards the mesh to the outside world over LTE. One per branch, placed where there is both coverage and access.',
    unitCost: 118,
    icon: 'cell',
  },
  {
    type: 'sensor',
    name: 'Sensor',
    role: 'Smells smoke',
    detail:
      'Particulate and gas sensing at ground level. Cheap enough to scatter, close enough to the fuel to catch a fire before it has a plume.',
    unitCost: 94,
    icon: 'sensor',
  },
  {
    type: 'vision',
    name: 'Vision',
    role: 'Sees smoke',
    detail:
      'A low-rate camera with on-device inference. Ridge-mounted for line of sight across a drainage. The expensive node, so the network uses few.',
    unitCost: 146,
    icon: 'camera',
  },
]

export function nodesByType(type: NodeType): readonly MeshNode[] {
  return NODES.filter((node) => node.type === type)
}

export function countByStatus(): Record<NodeStatus, number> {
  return NODES.reduce(
    (acc, node) => ({ ...acc, [node.status]: acc[node.status] + 1 }),
    { online: 0, degraded: 0, offline: 0 } as Record<NodeStatus, number>,
  )
}

export function findNode(id: string): MeshNode | undefined {
  return NODES.find((node) => node.id === id)
}

/** Link quality bands, from the Meshtastic SNR floor for the long-fast preset. */
export function linkQuality(snr: number): 'good' | 'marginal' | 'bad' {
  if (snr >= 4) return 'good'
  if (snr >= -7) return 'marginal'
  return 'bad'
}

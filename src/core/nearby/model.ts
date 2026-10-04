export const TRANSPORTS = ['bluetooth', 'usb'] as const
export type Transport = (typeof TRANSPORTS)[number]

export type ConnectionState = 'disconnected' | 'connecting' | 'initializing' | 'connected'
export type ConnectionError = 'permission' | 'unsupported' | 'timeout' | 'connection' | 'adapter'
/** A change read out to screen readers; the page words it. */
type Announcement = 'connecting' | 'connected' | 'disconnected' | 'failed' | 'removed' | 'restored'

export const RECENT_CONNECTION_MS = 10 * 60 * 1000

export type Reading = {
    readonly metric: string
    readonly value: number
    readonly sender: number
    readonly receivedAt: number
    readonly measuredAt: number | null
    readonly cached: boolean
}

/** A local measurement kept for trends; `at` is the measurement time, or receipt time without one. */
export type Sample = {
    readonly value: number
    readonly at: number
}

/** Local samples per metric, kept across reloads for trends. */
export type History = Readonly<Record<string, readonly Sample[]>>

/** Samples closer than this replace the newest one instead of growing the history. */
const SAMPLE_SPACING_MS = 5 * 60 * 1000
/** How long history is kept, in memory and in the browser's IndexedDB. */
const HISTORY_DAYS = 100
export const HISTORY_RETENTION_MS = HISTORY_DAYS * 24 * 60 * 60 * 1000

/** Keeps the newest sample last and older samples at least five minutes apart. */
export function addSample(samples: readonly Sample[], sample: Sample): readonly Sample[] {
    const last = samples.at(-1)
    if (last && sample.at <= last.at) return samples
    const beforeLast = samples.at(-2)
    const kept =
        beforeLast && sample.at - beforeLast.at < SAMPLE_SPACING_MS ? samples.slice(0, -1) : samples
    return [...kept, sample].filter((entry) => sample.at - entry.at <= HISTORY_RETENTION_MS)
}

export type Peer = {
    readonly num: number
    readonly name: string
    readonly shortName: string
    readonly hardware: string
    readonly lastPacketAt: number | null
    readonly lastHeardAt: number | null
    /** Link quality of the last packet heard directly, without relays or MQTT. */
    readonly snr: number | null
    readonly rssi: number | null
    readonly hopsAway: number | null
    readonly readings: Readonly<Record<string, Reading>>
}

export type Device = {
    readonly id: string
    readonly bluetoothName: string
    readonly transport: Transport
    readonly state: ConnectionState
    readonly nodeNum: number | null
    readonly name: string
    readonly shortName: string
    readonly firmware: string
    readonly hardware: string
    readonly connectedAt: number | null
    readonly recentUntil: number | null
    readonly lastPacketAt: number | null
    readonly configuration: Readonly<Record<string, string>>
    readonly readings: Readonly<Record<string, Reading>>
    readonly history: History
    readonly peers: Readonly<Record<number, Peer>>
    readonly activity: readonly { readonly at: number; readonly message: string }[]
}

export type Snapshot = {
    readonly devices: readonly Device[]
    readonly selectedId: string | null
    readonly busy: boolean
    readonly error: ConnectionError | null
    readonly announcement: Announcement | null
    readonly restoration: 'checking' | 'unsupported' | 'failed' | null
    /** The device just removed from the list, while its removal can still be undone. */
    readonly removed: Device | null
}

export function emptyDevice(
    id: string,
    bluetoothName: string,
    transport: Transport = 'bluetooth'
): Device {
    return {
        id,
        bluetoothName,
        transport,
        state: 'disconnected',
        nodeNum: null,
        name: '',
        shortName: '',
        firmware: '',
        hardware: '',
        connectedAt: null,
        recentUntil: null,
        lastPacketAt: null,
        configuration: {},
        readings: {},
        history: {},
        peers: {},
        activity: [],
    }
}

export function addActivity(device: Device, message: string, at: number): Device {
    return { ...device, activity: [...device.activity, { at, message }] }
}

export function nodeId(num: number): string {
    return `!${num.toString(16).padStart(8, '0')}`
}

export function deviceName(device: Pick<Device, 'name' | 'bluetoothName' | 'nodeNum'>): string {
    const name = device.name || device.bluetoothName
    if (device.nodeNum === null) return name
    // Default names end in the ID's last four hex digits, which the node tag already shows.
    const suffix = nodeId(device.nodeNum).slice(-4)
    if (name.toLowerCase() === suffix) return ''
    const trimmed = name.replace(new RegExp(`[\\s_-]+${suffix}$`, 'i'), '')
    return trimmed || name
}

export function isRecentDevice(device: Device): boolean {
    return device.state === 'disconnected' && device.recentUntil !== null
}

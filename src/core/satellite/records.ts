/*
 * The satellite receiver (firmware-satellite) prints one record per line:
 * JSON objects carrying a `type`, the board's uptime `t` in milliseconds and
 * its `boot` number, and `#` notes meant for a person. Only the JSON records
 * are kept here. The board has no clock: the page sends it the time, and
 * records from a boot that was synced carry `time` in Unix milliseconds.
 */

export type ReceiverFields = Readonly<Record<string, unknown>>

export type ReceiverEntry = {
    readonly id: number
    readonly type: string
    /** Board uptime in milliseconds. */
    readonly uptime: number
    readonly boot: number | null
    /** Wall-clock receive time; null for a stored packet from a boot never synced. */
    readonly at: number | null
    /** Received from the station's history replay rather than as it happened. */
    readonly replayed: boolean
    readonly fields: ReceiverFields
}

export type ReceiverPacket = {
    readonly status: number
    readonly length: number
    readonly rssi: number
    readonly snr: number
    readonly frequencyError: number
    readonly frequency: number
    readonly hex: string
}

export type SatelliteProfileRecord = {
    readonly id: string
    readonly norad: number
    readonly name: string
    readonly frequencyMHz: number
    readonly bandwidthKHz: number
    readonly spreadingFactor: number
    readonly confidence: string
}

export type SatelliteStatsRecord = {
    readonly profile: string
    readonly packets: number
    readonly crcErrors: number
    readonly cadHits: number
    readonly falseCad: number
    readonly lastUptime: number
    readonly lastRssi: number | null
}

export type SatelliteRangeResult = {
    readonly frequencyMHz: number
    readonly bandwidthKHz: number
    readonly spreadingFactor: number
    readonly cadHits: number
    readonly packets: number
    readonly timeouts: number
    readonly crcErrors: number
    readonly errors: number
    readonly bestRssi: number | null
    readonly lastRssi: number | null
    readonly lastUptime: number
}

export type SatellitePassRecord = {
    readonly norad: number
    readonly profile: string
    readonly aos: number
    readonly tca: number
    readonly los: number
    readonly maximumElevation: number
    readonly tleAgeDays: number
    readonly stale: boolean
}

export type StationTleRecord = {
    readonly norad: number
    readonly epoch: number | null
    readonly ageDays: number | null
    readonly present: boolean
}

export type StationLocationRecord = {
    readonly latitude: number
    readonly longitude: number
    readonly altitudeM: number
}

export type ReceiverLog = {
    readonly entries: readonly ReceiverEntry[]
    /** Wall-clock time minus board uptime; null until a live record arrives. */
    readonly offset: number | null
    /** The boot the offset belongs to. */
    readonly boot: number | null
    readonly nextId: number
    readonly packetKeys: ReadonlySet<string>
    readonly replaying: boolean
}

/** About a day of heartbeats every 30 s, plus the packets. */
const MAX_ENTRIES = 3000

/** RadioLib status codes the firmware reports for a received packet. */
export const PACKET_OK = 0
export const PACKET_CRC_MISMATCH = -7

/** Records that describe the station now, so their arrival fixes the clock offset. */
const LIVE_TYPES = new Set(['boot', 'hb', 'status'])

export const EMPTY_LOG: ReceiverLog = {
    entries: [],
    offset: null,
    boot: null,
    nextId: 1,
    packetKeys: new Set(),
    replaying: false,
}

function parseFields(line: string): ReceiverFields | null {
    if (!line.startsWith('{')) return null
    try {
        const value: unknown = JSON.parse(line)
        return typeof value === 'object' && value !== null && !Array.isArray(value)
            ? (value as ReceiverFields)
            : null
    } catch {
        return null
    }
}

export function numberField(fields: ReceiverFields, key: string): number | null {
    const value = fields[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function stringField(fields: ReceiverFields, key: string): string | null {
    const value = fields[key]
    return typeof value === 'string' ? value : null
}

export function textField(fields: ReceiverFields, key: string): string | null {
    return stringField(fields, key)
}

export function booleanField(fields: ReceiverFields, key: string): boolean | null {
    const value = fields[key]
    return typeof value === 'boolean' ? value : null
}

function latestByStringField(
    log: ReceiverLog,
    type: string,
    key: string
): readonly ReceiverEntry[] {
    const selected = new Map<string, ReceiverEntry>()
    for (const entry of log.entries) {
        if (entry.type !== type) continue
        const value = stringField(entry.fields, key)
        if (value !== null) selected.set(value, entry)
    }
    return Array.from(selected.values(), (entry) => entry)
}

export function satelliteProfiles(log: ReceiverLog): readonly SatelliteProfileRecord[] {
    return latestByStringField(log, 'profile', 'id')
        .map(({ fields }) => {
            const id = stringField(fields, 'id')
            const name = stringField(fields, 'name')
            const confidence = stringField(fields, 'confidence')
            const norad = numberField(fields, 'norad')
            const frequencyMHz = numberField(fields, 'freq')
            const bandwidthKHz = numberField(fields, 'bw')
            const spreadingFactor = numberField(fields, 'sf')
            return id === null ||
                name === null ||
                confidence === null ||
                norad === null ||
                frequencyMHz === null ||
                bandwidthKHz === null ||
                spreadingFactor === null
                ? null
                : { id, name, confidence, norad, frequencyMHz, bandwidthKHz, spreadingFactor }
        })
        .filter((profile): profile is SatelliteProfileRecord => profile !== null)
}

export function satelliteStats(log: ReceiverLog): readonly SatelliteStatsRecord[] {
    return latestByStringField(log, 'stats', 'profile')
        .map(({ fields }) => {
            const profile = stringField(fields, 'profile')
            const packets = numberField(fields, 'pkts')
            const crcErrors = numberField(fields, 'crc_err')
            const cadHits = numberField(fields, 'cad')
            const falseCad = numberField(fields, 'cad_false')
            const lastUptime = numberField(fields, 'last_t')
            return profile === null ||
                packets === null ||
                crcErrors === null ||
                cadHits === null ||
                falseCad === null ||
                lastUptime === null
                ? null
                : {
                      profile,
                      packets,
                      crcErrors,
                      cadHits,
                      falseCad,
                      lastUptime,
                      lastRssi: numberField(fields, 'last_rssi'),
                  }
        })
        .filter((stats): stats is SatelliteStatsRecord => stats !== null)
        .toSorted(
            (left, right) =>
                right.packets - left.packets || left.profile.localeCompare(right.profile)
        )
}

export function satellitePasses(log: ReceiverLog): readonly SatellitePassRecord[] {
    return log.entries
        .filter((entry) => entry.type === 'pass')
        .map(({ fields }) => {
            const profile = stringField(fields, 'profile')
            const norad = numberField(fields, 'norad')
            const aos = numberField(fields, 'aos')
            const tca = numberField(fields, 'tca')
            const los = numberField(fields, 'los')
            const maximumElevation = numberField(fields, 'max_el')
            const tleAgeDays = numberField(fields, 'tle_age_d')
            const stale = booleanField(fields, 'stale')
            return profile === null ||
                norad === null ||
                aos === null ||
                tca === null ||
                los === null ||
                maximumElevation === null ||
                tleAgeDays === null ||
                stale === null
                ? null
                : { profile, norad, aos, tca, los, maximumElevation, tleAgeDays, stale }
        })
        .filter((pass): pass is SatellitePassRecord => pass !== null)
        .toSorted((left, right) => left.aos - right.aos)
}

export function satelliteTles(log: ReceiverLog): readonly StationTleRecord[] {
    const latestByNorad = new Map<number, ReceiverEntry>()
    for (const entry of log.entries) {
        if (entry.type !== 'tle') continue
        const norad = numberField(entry.fields, 'norad')
        if (norad !== null) latestByNorad.set(norad, entry)
    }
    return Array.from(latestByNorad.values(), ({ fields }) => {
        const norad = numberField(fields, 'norad')
        return norad === null
            ? null
            : {
                  norad,
                  epoch: numberField(fields, 'epoch'),
                  ageDays: numberField(fields, 'age_d'),
                  present: booleanField(fields, 'present') ?? numberField(fields, 'epoch') !== null,
              }
    }).filter((tle): tle is StationTleRecord => tle !== null)
}

export function stationLocation(log: ReceiverLog): StationLocationRecord | null {
    const entry = latest(log, 'loc')
    if (!entry) return null
    const latitude = numberField(entry.fields, 'lat')
    const longitude = numberField(entry.fields, 'lon')
    const altitudeM = numberField(entry.fields, 'alt')
    return latitude === null || longitude === null || altitudeM === null
        ? null
        : { latitude, longitude, altitudeM }
}

export function firmwareSupportsSatelliteControls(log: ReceiverLog): boolean {
    // Only firmware with mode and tracking controls reports `fw`.
    return Boolean(textField(latest(log, 'status')?.fields ?? {}, 'fw'))
}

export function asPacket(entry: ReceiverEntry): ReceiverPacket | null {
    if (entry.type !== 'pkt') return null
    const { fields } = entry
    return {
        status: numberField(fields, 'st') ?? NaN,
        length: numberField(fields, 'len') ?? 0,
        rssi: numberField(fields, 'rssi') ?? NaN,
        snr: numberField(fields, 'snr') ?? NaN,
        frequencyError: numberField(fields, 'df') ?? NaN,
        frequency: numberField(fields, 'freq') ?? NaN,
        hex: stringField(fields, 'hex') ?? '',
    }
}

export type AppendResult = {
    readonly log: ReceiverLog
    /** A packet heard as it happened, not one replayed from history. */
    readonly livePacket: ReceiverEntry | null
}

/**
 * Adds one received line. Packets replayed from the station's history are
 * dropped when already seen in this page session.
 */
export function appendLine(log: ReceiverLog, line: string, now: number): AppendResult {
    const fields = parseFields(line.trim())
    const type = fields === null ? null : stringField(fields, 'type')
    const uptime = fields === null ? null : numberField(fields, 't')
    if (fields === null || type === null || uptime === null) return { log, livePacket: null }

    const boot = numberField(fields, 'boot')
    const live = LIVE_TYPES.has(type)
    const offset = live ? now - uptime : log.offset
    const currentBoot = live ? boot : log.boot
    // The history record closes the replay that its request started.
    const replaying = type === 'history' ? false : log.replaying

    let { packetKeys } = log
    if (type === 'pkt') {
        const key = `${String(boot)}:${String(uptime)}:${stringField(fields, 'hex') ?? ''}`
        if (packetKeys.has(key)) {
            return { log: { ...log, offset, boot: currentBoot }, livePacket: null }
        }
        packetKeys = new Set(packetKeys).add(key)
    }

    const sameBoot = boot === currentBoot && offset !== null
    const entry: ReceiverEntry = {
        id: log.nextId,
        type,
        uptime,
        boot,
        at: numberField(fields, 'time') ?? (sameBoot ? offset + uptime : replaying ? null : now),
        replayed: type === 'pkt' && replaying,
        fields,
    }
    const entries = [...log.entries, entry]
    return {
        log: {
            entries: entries.length > MAX_ENTRIES ? entries.slice(-MAX_ENTRIES) : entries,
            offset,
            boot: currentBoot,
            nextId: log.nextId + 1,
            packetKeys,
            replaying,
        },
        livePacket: type === 'pkt' && !entry.replayed ? entry : null,
    }
}

/** Marks the packets that follow as history until the closing `history` record. */
export function startReplay(log: ReceiverLog): ReceiverLog {
    return { ...log, replaying: true }
}

export function latest(log: ReceiverLog, type: string): ReceiverEntry | null {
    return log.entries.findLast((entry) => entry.type === type) ?? null
}

/** The whole log as JSON Lines, each record with its wall-clock time added. */
export function toJsonLines(log: ReceiverLog): string {
    return log.entries
        .map((entry) =>
            JSON.stringify({
                ...(entry.at !== null && { at: new Date(entry.at).toISOString() }),
                ...entry.fields,
            })
        )
        .join('\n')
}

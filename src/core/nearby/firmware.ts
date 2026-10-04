/**
 * The build builders should install, published as the `mfd-v<version>.<commit>`
 * release of the firmware repository and served by this site.
 */
export const MFD_RELEASE = { version: '2.7.26', commit: '7d798c3' } as const

export const MFD_BUILD = `${MFD_RELEASE.version}.${MFD_RELEASE.commit}` as const

/** A checksum-verified release artifact bundled with the site, including on project Pages. */
export const MFD_UF2 = {
    name: `firmware-rak4631-${MFD_BUILD}.uf2`,
    href: `${import.meta.env.BASE_URL}files/firmware-rak4631-${MFD_BUILD}.uf2`,
    sha256: '4138c8a6715a3eaf20bf9424f6a91f6e26cf7463b937fdb778185bde71737a4b',
} as const

/**
 * Commits of the Mesh Fire Detection firmware fork. Meshtastic reports its
 * version as `major.minor.patch.commit`, so a release of ours is recognised by
 * the commit it was built from. Keep earlier published builds next to the release.
 */
const MFD_BUILDS: ReadonlySet<string> = new Set([MFD_RELEASE.commit])

export type Firmware = {
    readonly version: string
    readonly build: string
    readonly ours: boolean
}

export function parseFirmware(raw: string): Firmware | null {
    const text = raw.trim()
    if (!text) return null
    const match = /^(\d+\.\d+\.\d+)\.([0-9a-f]{7,})$/i.exec(text)
    if (!match?.[1] || !match[2]) return { version: text, build: '', ours: false }
    const build = match[2].toLowerCase()
    return { version: match[1], build, ours: MFD_BUILDS.has(build.slice(0, 7)) }
}

export type FirmwareUpdate = 'current' | 'outdated' | 'other' | 'unknown'

/** Progress of rebooting a node into its UF2 bootloader from the Firmware page. */
export type DfuState =
    | 'idle'
    | 'rebooting'
    | 'bootloader'
    | 'selecting'
    | 'fetching'
    | 'writing'
    | 'done'
    | 'busy'
    | 'timeout'
    | 'failed'
    | 'wrongDrive'

/** Whether a node's reported firmware is the current release, an older build of ours, or not ours. */
export function firmwareUpdate(raw: string): FirmwareUpdate {
    const firmware = parseFirmware(raw)
    if (!firmware) return 'unknown'
    if (!firmware.ours) return 'other'
    return firmware.version === MFD_RELEASE.version && firmware.build.startsWith(MFD_RELEASE.commit)
        ? 'current'
        : 'outdated'
}

export type NodeKind = 'base' | 'cellular' | 'sensor' | 'vision' | 'test'

/** The word after `MFD ` in a long name; `Node` is the firmware's name for a Base. */
const NAME_KINDS: Readonly<Record<string, NodeKind>> = {
    base: 'base',
    node: 'base',
    cellular: 'cellular',
    sensor: 'sensor',
    vision: 'vision',
    test: 'test',
}

const SHORT_KINDS: Readonly<Record<string, NodeKind>> = {
    MFDB: 'base',
    MFDN: 'base',
    MFDC: 'cellular',
    MFDS: 'sensor',
    MFDV: 'vision',
    MFDT: 'test',
}

/**
 * Our firmware names a node `MFD Sensor xxxx` or `MFD Node xxxx` (short `MFDS`/
 * `MFDN`); builders name other kinds the same way, e.g. `MFD Test` for a bench
 * node. Peers do not report their firmware, so this name is the only sign of
 * ours and of the node's kind; a node renamed outside the pattern is missed.
 */
export function mfdKind(node: {
    readonly name: string
    readonly shortName: string
}): NodeKind | null {
    const word = /^MFD (\w+)/i.exec(node.name)?.[1]?.toLowerCase()
    return (
        (word === undefined ? undefined : NAME_KINDS[word]) ??
        SHORT_KINDS[node.shortName.trim()] ??
        null
    )
}

export function isMfdNode(node: {
    readonly name: string
    readonly shortName: string
    readonly firmware?: string
}): boolean {
    return parseFirmware(node.firmware ?? '')?.ours ?? mfdKind(node) !== null
}

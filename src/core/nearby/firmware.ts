/**
 * Commits of the Mesh Fire Detection firmware fork. Meshtastic reports its
 * version as `major.minor.patch.commit`, so a release of ours is recognised by
 * the commit it was built from. Add each published build here.
 */
const MFD_BUILDS: ReadonlySet<string> = new Set(['7d798c3'])

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

/**
 * Our firmware renames a node from Meshtastic's default to `MFD Sensor xxxx` or
 * `MFD Node xxxx` (short `MFDS`/`MFDN`). Peers do not report their firmware, so
 * this default name is the only sign of ours; a node renamed by hand is missed.
 */
export function hasMfdName(node: { readonly name: string; readonly shortName: string }): boolean {
    return /^MFD (?:Sensor|Node)\b/.test(node.name) || /^MFD[NS]$/.test(node.shortName.trim())
}

export function isMfdNode(node: {
    readonly name: string
    readonly shortName: string
    readonly firmware?: string
}): boolean {
    return parseFirmware(node.firmware ?? '')?.ours ?? hasMfdName(node)
}

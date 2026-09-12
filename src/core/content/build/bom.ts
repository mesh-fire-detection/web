import { PARTS, primaryVendor, type PartId } from '@core/content/build/parts'
import { isShipped, storeFor, type StoreId } from '@core/content/build/stores'
import type { NodeType } from '@core/content/network/network'

export type BomLine = {
    part: PartId
    quantity: number
    /** Parts shared with the Base build are marked so totals stay honest. */
    inheritedFromBase?: boolean
}

export type Bom = {
    type: NodeType
    title: string
    summary: string
    parts: readonly BomLine[]
    /** Anything not on the list: postage, printing time, hardware store bits. */
    incidentals: number
    buildMinutes: number
    confidence: 'priced' | 'estimated'
}

const BASE_PARTS = [
    { part: 'starterKit', quantity: 1 },
    { part: 'solarPanel', quantity: 1 },
    { part: 'antenna', quantity: 1 },
    { part: 'battery', quantity: 1 },
    { part: 'enclosure', quantity: 1 },
] as const satisfies readonly BomLine[]

/** Parts carried into every non-Base build. */
const inherited = BASE_PARTS.map((line) => ({ ...line, inheritedFromBase: true as const }))

export const BOMS = [
    {
        type: 'base',
        title: 'Base node',
        summary:
            'The number the whole project rests on. Five parts, no soldering, one printed shell.',
        parts: BASE_PARTS,
        incidentals: 0,
        buildMinutes: 25,
        confidence: 'priced',
    },
    {
        type: 'cellular',
        title: 'Cellular node',
        summary:
            'A Base node plus an LTE modem and the antenna to use it. One per branch, so the cost amortises across every node behind it.',
        parts: [
            ...inherited,
            { part: 'lteModule', quantity: 1 },
            { part: 'lteAntenna', quantity: 1 },
            { part: 'iotSim', quantity: 1 },
        ],
        incidentals: 0,
        buildMinutes: 45,
        confidence: 'estimated',
    },
    {
        type: 'sensor',
        title: 'Sensor node',
        summary:
            'Particulate plus gas. The sensor selection here is not settled — this is the current best candidate, not a recommendation.',
        parts: [
            ...inherited,
            { part: 'sps30', quantity: 1 },
            { part: 'bme688', quantity: 1 },
            { part: 'sensorHead', quantity: 1 },
        ],
        incidentals: 0,
        buildMinutes: 60,
        confidence: 'estimated',
    },
    {
        type: 'vision',
        title: 'Vision node',
        summary:
            'A camera and enough compute to decide locally whether a frame is worth a packet. The most expensive node and the least proven.',
        parts: [
            ...inherited,
            { part: 'camera', quantity: 1 },
            { part: 'battery', quantity: 1 },
            { part: 'solarPanel', quantity: 1 },
            { part: 'cameraHood', quantity: 1 },
        ],
        incidentals: 0,
        buildMinutes: 90,
        confidence: 'estimated',
    },
] as const satisfies readonly Bom[]

export function lineCost(line: BomLine): number {
    return primaryVendor(PARTS[line.part]).unitPrice * line.quantity
}

export function bomTotal(bom: Bom): number {
    return bom.parts.reduce((sum, line) => sum + lineCost(line), 0) + bom.incidentals
}

export function bomFor(type: NodeType): Bom {
    const found = BOMS.find((bom) => bom.type === type)
    if (!found) throw new Error(`No bill of materials for node type "${type}"`)
    return found
}

export function nodeCost(type: NodeType): number {
    return bomTotal(bomFor(type))
}

/**
 * What the build actually looks like as orders rather than as lines.
 *
 * The unit cost is a sum of cheapest-per-line prices, which is not a basket
 * anyone can check out: the parts come from several storefronts, each with its
 * own postage. Grouping the lines by store is the honest shape of the purchase,
 * and it is what makes "buy the RAK parts together" visible as advice.
 */
export type Basket = {
    store: StoreId
    subtotal: number
    lines: readonly BomLine[]
}

export function supplierBaskets(bom: Bom): readonly Basket[] {
    const storeOf = (line: BomLine): StoreId => primaryVendor(PARTS[line.part]).store

    const stores: StoreId[] = []
    for (const line of bom.parts) {
        const store = storeOf(line)
        if (!stores.includes(store)) stores.push(store)
    }

    return stores.map((store) => {
        const lines = bom.parts.filter((line) => storeOf(line) === store)

        return {
            store,
            subtotal: lines.reduce((sum, line) => sum + lineCost(line), 0),
            lines,
        }
    })
}

/** Baskets that carry postage. Printed parts are not an order. */
export function orderCount(bom: Bom): number {
    return supplierBaskets(bom).filter((basket) => isShipped(storeFor(basket.store))).length
}

export function branchHardwareCost(nodes: readonly { readonly type: NodeType }[]): number {
    return nodes.reduce((sum, node) => sum + nodeCost(node.type), 0)
}

export type Download = {
    name: string
    detail: string
    href: string
    kind: 'stl' | 'json' | 'doc'
    size: string
    /**
     * False while a file has not been published yet. The card renders as pending
     * and points at the repository rather than serving a dead link — the whole
     * claim of this page is that nothing is missing, so missing things say so.
     */
    available: boolean
}

export const DOWNLOADS = [
    {
        name: 'base-enclosure-v3.stl',
        detail: 'IP65 shell for the Base node. ASA, 0.2 mm layers, no supports.',
        href: 'https://github.com/mesh-fire-detection/hardware',
        kind: 'stl',
        size: '1.4 MB',
        available: false,
    },
    {
        name: 'sensor-head-v2.stl',
        detail: 'Vented intake head for the SPS30. Prints in the same orientation as the shell.',
        href: 'https://github.com/mesh-fire-detection/hardware',
        kind: 'stl',
        size: '780 KB',
        available: false,
    },
    {
        name: 'vision-hood-v1.stl',
        detail: 'Camera hood and window frame. Needs a 30 × 30 mm acrylic offcut.',
        href: 'https://github.com/mesh-fire-detection/hardware',
        kind: 'stl',
        size: '610 KB',
        available: false,
    },
    {
        name: 'mast-clamp-50mm.stl',
        detail: 'Two-part clamp for 50 mm pipe. Two M5 bolts, no printed threads.',
        href: 'https://github.com/mesh-fire-detection/hardware',
        kind: 'stl',
        size: '340 KB',
        available: false,
    },
    {
        name: 'meshtastic-base-us915.json',
        detail: 'Channel, region, hop limit and power settings for a Base node.',
        href: `${import.meta.env.BASE_URL}files/meshtastic-base-us915.json`,
        kind: 'json',
        size: '3 KB',
        available: true,
    },
    {
        name: 'meshtastic-sensor-us915.json',
        detail: 'Base preset plus telemetry intervals and sensor module config.',
        href: `${import.meta.env.BASE_URL}files/meshtastic-sensor-us915.json`,
        kind: 'json',
        size: '4 KB',
        available: true,
    },
] as const satisfies readonly Download[]

export type AssemblyStep = {
    title: string
    detail: string
    minutes: number
}

export const ASSEMBLY = [
    {
        title: 'Flash the firmware',
        detail: 'Connect the RAK4631 over USB and flash from the Meshtastic web installer in Chrome. No toolchain, no drivers on macOS or Linux.',
        minutes: 5,
    },
    {
        title: 'Load the config preset',
        detail: 'Import the JSON for the node type you are building. It sets region US915, the long-fast preset, hop limit 5, and the telemetry intervals.',
        minutes: 3,
    },
    {
        title: 'Print the shell',
        detail: 'ASA at 0.2 mm, four walls, 30% infill. PLA will fail in a sunlit enclosure by the second summer — this is the one material substitution that matters.',
        minutes: 0,
    },
    {
        title: 'Fit the cell and panel',
        detail: 'Cell into the holder, panel lead through the grommet, silicone the pass-through. Heat-shrink every joint and leave no terminal bare next to the metal mounting hardware. Check polarity twice; the board has no reverse protection.',
        minutes: 11,
    },
    {
        title: 'Seal and soak-test',
        detail: 'Seat the TPU gasket in the lid groove, close the shell hard enough to compress it, then leave the node outdoors for 48 hours before you carry it anywhere remote. Most failures show up in the first two days.',
        minutes: 7,
    },
    {
        title: 'Mount and confirm',
        detail: 'Get the antenna as high as the site allows and vertical. Confirm the node appears on the map and that its first hop shows SNR above 4 dB.',
        minutes: 20,
    },
] as const satisfies readonly AssemblyStep[]

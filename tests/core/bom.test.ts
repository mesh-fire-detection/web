import { describe, expect, it } from 'vitest'

import {
    bomFor,
    bomTotal,
    branchHardwareCost,
    lineCost,
    nodeCost,
    orderCount,
    supplierBaskets,
} from '@core/content/build/bom'
import { PARTS, primaryVendor, type PartId } from '@core/content/build/parts'
import { STORES, isShipped, storeFor } from '@core/content/build/stores'
import { NODES, type NodeType } from '@core/content/network/network'

const PRINTED = new Set<PartId>(['enclosure', 'sensorHead', 'cameraHood'])

describe('parts catalog', () => {
    it('stores every catalog price as a whole dollar', () => {
        for (const part of Object.values(PARTS)) {
            expect(part.vendors.length).toBeGreaterThan(0)
            for (const vendor of part.vendors) {
                expect(Number.isSafeInteger(vendor.unitPrice)).toBe(true)
                expect(vendor.unitPrice).toBeGreaterThan(0)
            }
        }
    })

    it('lists two priced stores for every bought part', () => {
        for (const [id, part] of Object.entries(PARTS) as readonly (readonly [
            PartId,
            (typeof PARTS)[PartId],
        ])[]) {
            expect(part.vendors).toHaveLength(PRINTED.has(id) ? 1 : 2)
        }
    })

    it('derives the Base node cost from the first store of each part', () => {
        const bom = bomFor('base')
        const fromLines = bom.parts.reduce((sum, line) => sum + lineCost(line), 0)

        expect(fromLines).toBe(bomTotal(bom))
        expect(nodeCost('base')).toBe(fromLines)
        expect(nodeCost('base')).toBe(
            primaryVendor(PARTS.starterKit).unitPrice +
                primaryVendor(PARTS.solarPanel).unitPrice +
                primaryVendor(PARTS.antenna).unitPrice +
                primaryVendor(PARTS.battery).unitPrice +
                primaryVendor(PARTS.enclosure).unitPrice
        )
        expect(nodeCost('base')).toBe(55)
    })

    it('derives branch hardware cost from node types', () => {
        const expected = NODES.reduce((sum, node) => sum + nodeCost(node.type), 0)

        expect(branchHardwareCost(NODES)).toBe(expected)
    })

    it('points every vendor at a store that exists', () => {
        for (const part of Object.values(PARTS)) {
            for (const vendor of part.vendors) {
                expect(Object.keys(STORES)).toContain(vendor.store)
            }
        }
    })
})

describe('order plan', () => {
    it('splits every node into baskets that add back up to its cost', () => {
        for (const type of ['base', 'cellular', 'sensor', 'vision'] satisfies NodeType[]) {
            const bom = bomFor(type)
            const baskets = supplierBaskets(bom)

            const fromBaskets = baskets.reduce((sum, basket) => sum + basket.subtotal, 0)
            expect(fromBaskets).toBe(nodeCost(type))

            const lines = baskets.reduce((sum, basket) => sum + basket.lines.length, 0)
            expect(lines).toBe(bom.parts.length)

            for (const basket of baskets) expect(basket.lines.length).toBeGreaterThan(0)

            const stores = baskets.map((basket) => basket.store)
            expect(new Set(stores).size).toBe(stores.length)
        }
    })

    it('counts shipped baskets only, so printed parts are not an order', () => {
        const bom = bomFor('base')
        const printed = supplierBaskets(bom).filter((basket) => !isShipped(storeFor(basket.store)))

        expect(printed).toHaveLength(1)
        expect(orderCount(bom)).toBe(supplierBaskets(bom).length - 1)
        expect(orderCount(bom)).toBe(2)
    })

    it('needs more orders for every node type that adds parts to Base', () => {
        expect(orderCount(bomFor('cellular'))).toBe(3)
        expect(orderCount(bomFor('sensor'))).toBe(4)
        expect(orderCount(bomFor('vision'))).toBe(3)
    })
})

describe('store catalogue', () => {
    it('publishes a source page for every numeric shipping claim', () => {
        for (const id of Object.keys(STORES)) {
            const store = storeFor(id as keyof typeof STORES)
            if (store.shipping.kind === 'checkout' || store.shipping.kind === 'none') continue

            expect(store.policyUrl, `${store.name} states a figure without a source`).toBeDefined()
        }
    })

    it('keeps every store link absolute except the printed-parts placeholder', () => {
        for (const id of Object.keys(STORES)) {
            const store = storeFor(id as keyof typeof STORES)
            const absolute = store.url.startsWith('https://')

            expect(absolute || store.shipping.kind === 'none').toBe(true)
            if (store.policyUrl !== undefined) {
                expect(store.policyUrl.startsWith('https://')).toBe(true)
            }
        }
    })
})

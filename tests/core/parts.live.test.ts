import { describe, expect, it } from 'vitest'

import { PARTS, primaryVendor, type CatalogVendor } from '@core/content/build/parts'
import { STORES, storeFor, type StoreId } from '@core/content/build/stores'

const REQUEST_MS = 20_000

const USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

type ShopifyVariant = {
    title: string
    sku: string
    price: string
}

type ShopifyProduct = {
    title: string
    variants: readonly ShopifyVariant[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

const isVariant = (value: unknown): value is ShopifyVariant => {
    return isRecord(value)
        ? typeof value['title'] === 'string' &&
              typeof value['sku'] === 'string' &&
              typeof value['price'] === 'string'
        : false
}

const isProduct = (value: unknown): value is ShopifyProduct => {
    if (!isRecord(value)) return false
    const { title, variants } = value
    return typeof title === 'string' && Array.isArray(variants) && variants.every(isVariant)
}

async function fetchShopifyProduct(url: string): Promise<ShopifyProduct> {
    const response = await fetch(`${url}.json`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_MS),
    })
    expect(response.status, `${url}.json returned ${String(response.status)}`).toBe(200)
    const body: unknown = await response.json()
    expect(isRecord(body) && isProduct(body['product'])).toBe(true)
    if (!isRecord(body) || !isProduct(body['product'])) {
        throw new Error(`Unexpected Shopify payload for ${url}`)
    }
    return body['product']
}

function roundedPrice(variant: ShopifyVariant): number {
    return Math.round(Number(variant.price))
}

function secondVendor(vendors: readonly CatalogVendor[]): CatalogVendor {
    const vendor = vendors[1]
    expect(vendor, 'second store missing').toBeDefined()
    if (!vendor) throw new Error('second store missing')
    return vendor
}

describe('live catalog parts', () => {
    it(
        'finds the WisBlock starter kit and matches the rounded US915 price',
        async () => {
            const vendor = primaryVendor(PARTS.starterKit)
            const product = await fetchShopifyProduct(vendor.url)
            expect(product.title).toContain('RAK10722')

            const variant = product.variants.find(
                (item) =>
                    item.title.includes('RAK19007') &&
                    item.title.includes('no additional modules') &&
                    item.title.includes('US915')
            )
            expect(variant, 'US915 RAK19007 kit variant missing').toBeDefined()
            if (!variant) return
            expect(roundedPrice(variant)).toBe(vendor.unitPrice)
        },
        REQUEST_MS
    )

    it(
        'finds the Rokland starter kit listing and matches the rounded price',
        async () => {
            const vendor = secondVendor(PARTS.starterKit.vendors)
            const product = await fetchShopifyProduct(vendor.url)
            expect(product.title).toContain('Starter Kit')
            const [variant] = product.variants
            expect(variant).toBeDefined()
            if (!variant) return
            expect(roundedPrice(variant)).toBe(vendor.unitPrice)
        },
        REQUEST_MS
    )

    it(
        'finds the solar panel SKU 920399 and matches the rounded price',
        async () => {
            const vendor = primaryVendor(PARTS.solarPanel)
            const product = await fetchShopifyProduct(vendor.url)
            const variant = product.variants.find((item) => item.sku === '920399')
            expect(variant, 'SKU 920399 missing').toBeDefined()
            if (!variant) return
            expect(roundedPrice(variant)).toBe(vendor.unitPrice)
        },
        REQUEST_MS
    )

    it(
        'finds the Rokland solar panel listing and matches the rounded price',
        async () => {
            const vendor = secondVendor(PARTS.solarPanel.vendors)
            const product = await fetchShopifyProduct(vendor.url)
            const [variant] = product.variants
            expect(variant).toBeDefined()
            if (!variant) return
            expect(roundedPrice(variant)).toBe(vendor.unitPrice)
        },
        REQUEST_MS
    )

    it(
        'finds the RAK whip antenna US915 variant and matches the rounded price',
        async () => {
            const vendor = primaryVendor(PARTS.antenna)
            const product = await fetchShopifyProduct(vendor.url)
            const variant = product.variants.find((item) => item.sku === '926275')
            expect(variant, 'SKU 926275 missing').toBeDefined()
            if (!variant) return
            expect(roundedPrice(variant)).toBe(vendor.unitPrice)
        },
        REQUEST_MS
    )

    it(
        'finds the Atlavox whip antenna listing and matches the rounded price',
        async () => {
            const vendor = secondVendor(PARTS.antenna.vendors)
            const product = await fetchShopifyProduct(vendor.url)
            const [variant] = product.variants
            expect(variant).toBeDefined()
            if (!variant) return
            expect(roundedPrice(variant)).toBe(vendor.unitPrice)
        },
        REQUEST_MS
    )

    it(
        'finds the Panasonic NCR18650GA cell and matches the rounded price',
        async () => {
            const vendor = primaryVendor(PARTS.battery)
            const product = await fetchShopifyProduct(vendor.url)
            expect(product.title).toContain('NCR18650GA')
            expect(product.variants.length).toBeGreaterThan(0)
            const [variant] = product.variants
            expect(variant).toBeDefined()
            if (!variant) return
            expect(roundedPrice(variant)).toBe(vendor.unitPrice)
        },
        REQUEST_MS
    )

    it(
        'finds the RAK13102 NoteCard variant and matches the rounded price',
        async () => {
            const vendor = primaryVendor(PARTS.lteModule)
            const product = await fetchShopifyProduct(vendor.url)
            expect(product.title).toContain('RAK13102')
            const variant = product.variants.find((item) => item.sku === '110135')
            expect(variant, 'RAK13102 NoteCard SKU 110135 missing').toBeDefined()
            if (!variant) return
            expect(roundedPrice(variant)).toBe(vendor.unitPrice)
        },
        REQUEST_MS
    )

    it(
        'finds the LTE antenna SKU 920031 and matches the rounded price',
        async () => {
            const vendor = primaryVendor(PARTS.lteAntenna)
            const product = await fetchShopifyProduct(vendor.url)
            const variant = product.variants.find((item) => item.sku === '920031')
            expect(variant, 'LTE antenna SKU 920031 missing').toBeDefined()
            if (!variant) return
            expect(roundedPrice(variant)).toBe(vendor.unitPrice)
        },
        REQUEST_MS
    )
})

/**
 * Shipping policies go stale the same way prices do, and they are the only
 * claims on the page we cannot derive from a product feed. Several of these
 * sellers refuse automated clients, so a 403 is treated as "the page is there
 * but not readable" — a 404 still fails, because that means the source moved.
 */
const policyStores = Object.keys(STORES)
    .map((id) => storeFor(id as StoreId))
    .filter((store) => store.policyUrl !== undefined)

describe('live store policies', () => {
    it.each(policyStores.map((store) => [store.name, store] as const))(
        '%s still publishes its shipping policy',
        async (_name, store) => {
            const url = store.policyUrl
            expect(url).toBeDefined()
            if (url === undefined) return

            const response = await fetch(url, {
                headers: { 'User-Agent': USER_AGENT },
                signal: AbortSignal.timeout(REQUEST_MS),
            })

            expect(
                [200, 403].includes(response.status),
                `${url} returned ${String(response.status)}`
            ).toBe(true)

            const { shipping } = store
            const amount =
                shipping.kind === 'free_over'
                    ? shipping.threshold
                    : shipping.kind === 'flat' || shipping.kind === 'from'
                      ? shipping.amount
                      : null

            if (amount === null || response.status !== 200) return

            const body = await response.text()
            const candidates = [`$${String(amount)}`, `$${amount.toFixed(2)}`]

            expect(
                candidates.some((candidate) => body.includes(candidate)),
                `${url} no longer mentions ${candidates.join(' or ')}`
            ).toBe(true)
        },
        REQUEST_MS
    )
})

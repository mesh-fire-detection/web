import { describe, expect, it } from 'vitest'

import {
    PARTS,
    type CatalogPart,
    type CatalogPriceCheck,
    type CatalogVendor,
    type PartId,
} from '@core/content/build/parts'
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

async function fetchMetaProductPrice(url: string): Promise<number> {
    const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_MS),
    })
    expect(response.status, `${url} returned ${String(response.status)}`).toBe(200)
    const html = await response.text()
    const meta = /<meta\s+[^>]*property=["']product:price:amount["'][^>]*>/i.exec(html)?.[0]
    const amount = /\bcontent=["']([\d.]+)["']/i.exec(meta ?? '')?.[1]
    expect(amount, `${url} has no product price metadata`).toBeDefined()
    if (!amount) throw new Error(`No product price metadata for ${url}`)
    return Math.round(Number(amount))
}

function roundedPrice(variant: ShopifyVariant): number {
    return Math.round(Number(variant.price))
}

function selectedShopifyVariant(
    product: ShopifyProduct,
    priceCheck: Extract<CatalogPriceCheck, { readonly kind: 'shopify' }>
): ShopifyVariant | undefined {
    const { variant } = priceCheck
    return 'sku' in variant
        ? product.variants.find((item) => item.sku === variant.sku)
        : 'titleIncludes' in variant
          ? product.variants.find((item) =>
                variant.titleIncludes.every((part) => item.title.includes(part))
            )
          : product.variants[variant.index]
}

type LiveCatalogSource = {
    readonly name: string
    readonly vendor: CatalogVendor
    readonly priceCheck: CatalogPriceCheck
}

const liveCatalogSources: readonly LiveCatalogSource[] = (
    Object.entries(PARTS) as [PartId, CatalogPart][]
).flatMap(([partId, part]) =>
    part.vendors.flatMap((vendor) =>
        vendor.priceCheck === undefined
            ? []
            : [{ name: partId + ': ' + vendor.product, vendor, priceCheck: vendor.priceCheck }]
    )
)

describe('live catalog parts', () => {
    it.each(liveCatalogSources)(
        '$name matches the listed price',
        async ({ vendor, priceCheck }) => {
            if (priceCheck.kind === 'meta-price') {
                expect(await fetchMetaProductPrice(vendor.url)).toBe(vendor.unitPrice)
                return
            }

            const product = await fetchShopifyProduct(vendor.url)
            if (priceCheck.productTitleIncludes !== undefined) {
                expect(product.title).toContain(priceCheck.productTitleIncludes)
            }
            const variant = selectedShopifyVariant(product, priceCheck)
            expect(variant, 'listed product variant missing for ' + vendor.url).toBeDefined()
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

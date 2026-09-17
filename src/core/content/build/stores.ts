/**
 * The stores a part can be bought from, and what each one publishes about
 * shipping.
 *
 * Only claims that a seller states on its own page live here. Shipping is
 * modelled as a policy, not a price: what a parcel actually costs depends on
 * the destination, the weight and — for cells — hazmat rules, and none of that
 * is knowable from a catalogue. A published threshold or flat rate is stable
 * and can be re-checked by `npm run check:prices`; an invented average cannot.
 */

type ShippingPolicy =
    /** Free above a published basket size, so one order can beat two. */
    | { readonly kind: 'free_over'; readonly threshold: number }
    /** One published rate per order, whatever the basket. */
    | { readonly kind: 'flat'; readonly amount: number }
    /** A published floor; the real figure appears at checkout. */
    | { readonly kind: 'from'; readonly amount: number }
    /** Quoted at checkout, nothing publishable. */
    | { readonly kind: 'checkout' }
    /** Nothing ships: printed parts and filament. */
    | { readonly kind: 'none' }

export type Store = {
    readonly name: string
    /** Storefront root. */
    readonly url: string
    /** The page the shipping claim is taken from. Absent when none is published. */
    readonly policyUrl?: string
    readonly origin: 'domestic' | 'international'
    readonly shipping: ShippingPolicy
    /** The part of the cost that is not the shipping line itself. */
    readonly note?: string
}

export const STORES = {
    rakwireless: {
        name: 'RAKwireless',
        url: 'https://store.rakwireless.com',
        policyUrl: 'https://store.rakwireless.com/policies/shipping-policy',
        origin: 'international',
        shipping: { kind: 'checkout' },
        note: 'Ships from Asia. DDP runs 15–20 business days; on DAP the customs duty is yours.',
    },
    rokland: {
        name: 'Rokland',
        url: 'https://store.rokland.com',
        origin: 'domestic',
        shipping: { kind: 'checkout' },
        note: 'Authorised RAK distributor shipping from the USA, so no import duty on top.',
    },
    atlavox: {
        name: 'Atlavox',
        url: 'https://atlavox.com',
        policyUrl: 'https://atlavox.com/policies/shipping-policy',
        origin: 'domestic',
        shipping: { kind: 'free_over', threshold: 50 },
    },
    batteryStore18650: {
        name: '18650 Battery Store',
        url: 'https://www.18650batterystore.com',
        policyUrl: 'https://www.18650batterystore.com/pages/shipping-and-returns',
        origin: 'domestic',
        shipping: { kind: 'from', amount: 5 },
        note: 'Lithium is a regulated load: ground services only, and the carrier list narrows with cell count.',
    },
    illumn: {
        name: 'Illumn',
        url: 'https://illumn.com',
        origin: 'domestic',
        shipping: { kind: 'checkout' },
    },
    digikey: {
        name: 'DigiKey',
        url: 'https://www.digikey.com',
        policyUrl: 'https://www.digikey.com/en/help/saturday-delivery-options',
        origin: 'domestic',
        shipping: { kind: 'flat', amount: 6.99 },
        note: 'No free-shipping threshold inside the USA, whatever the basket size.',
    },
    mouser: {
        name: 'Mouser',
        url: 'https://www.mouser.com',
        policyUrl: 'https://www.mouser.com/Shipping-Information/',
        origin: 'domestic',
        shipping: { kind: 'checkout' },
    },
    adafruit: {
        name: 'Adafruit',
        url: 'https://www.adafruit.com',
        policyUrl: 'https://www.adafruit.com/shipping',
        origin: 'domestic',
        shipping: { kind: 'checkout' },
    },
    sparkfun: {
        name: 'SparkFun',
        url: 'https://www.sparkfun.com',
        origin: 'domestic',
        shipping: { kind: 'checkout' },
    },
    seeed: {
        name: 'Seeed Studio',
        url: 'https://www.seeedstudio.com',
        origin: 'international',
        shipping: { kind: 'checkout' },
        note: 'Ships from Asia; customs treatment matches the RAK store.',
    },
    amazon: {
        name: 'Amazon',
        url: 'https://www.amazon.com',
        origin: 'domestic',
        shipping: { kind: 'checkout' },
    },
    kiloElectronics: {
        name: 'Kilo Electronics',
        url: 'https://kiloelectronics.com',
        origin: 'international',
        shipping: { kind: 'checkout' },
        note: 'Prices quoted excluding VAT.',
    },
    connectedThings: {
        name: 'Connected Things',
        url: 'https://eu.connectedthings.store',
        origin: 'international',
        shipping: { kind: 'checkout' },
        note: 'Prices quoted excluding VAT.',
    },
    selfPrinted: {
        name: 'Self-printed',
        url: '/build#enclosures',
        origin: 'domestic',
        shipping: { kind: 'none' },
    },
} as const satisfies Record<string, Store>

export type StoreId = keyof typeof STORES

/**
 * Reads a store as the declared shape rather than as its literal.
 * `as const` drops optional keys the entry does not set, so indexing `STORES`
 * directly leaves `policyUrl` and `note` unreachable on half the union.
 */
export function storeFor(id: StoreId): Store {
    return STORES[id]
}

/** Printed parts are not an order, so they never count toward postage. */
export function isShipped(store: Store): boolean {
    return store.shipping.kind !== 'none'
}

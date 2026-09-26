/**
 * The only place a part’s names, technical details, store links, or prices may be written.
 * Node totals and every advertised dollar figure are derived from vendor[0].
 */

import type { StoreId } from '@core/content/build/stores'

type CatalogNote = {
    readonly title: string
    readonly detail: string
}

export type CatalogPriceCheck =
    | {
          readonly kind: 'shopify'
          readonly productTitleIncludes?: string
          readonly variant:
              | { readonly sku: string }
              | { readonly titleIncludes: readonly string[] }
              | { readonly index: number }
      }
    | { readonly kind: 'meta-price' }

export type CatalogVendor = {
    /** Specific item in that store’s cart. */
    product: string
    /** Who sells it. Name and shipping policy live in `stores.ts`. */
    store: StoreId
    url: string
    /** USD, stored already rounded to a whole dollar. */
    unitPrice: number
    /** Live price selector for catalog entries with an automated source check. */
    priceCheck?: CatalogPriceCheck
}

export type CatalogPart = {
    /** Role in the build. */
    component: string
    detail: string
    /** Selected LoRa antenna gain used for the link-budget defaults. */
    antennaGainDbi?: number
    /** Product-specific measurements, kept with the product entry. */
    measurements?: readonly CatalogNote[]
    /** Product-specific integration notes, kept with the product entry. */
    integration?: readonly CatalogNote[]
    /**
     * Bought parts list available storefronts. Printed parts list the
     * filament cost once. Running totals always use the first vendor.
     */
    vendors: readonly [CatalogVendor, ...CatalogVendor[]]
}

export function primaryVendor(part: CatalogPart): CatalogVendor {
    return part.vendors[0]
}

export const PARTS = {
    starterKit: {
        component: 'WisBlock Meshtastic Starter Kit',
        detail: 'RAK19007 base board, RAK4631 core, US915. The whole radio in one part.',
        vendors: [
            {
                product: 'RAK10722',
                store: 'rakwireless',
                url: 'https://store.rakwireless.com/products/wisblock-meshtastic-starter-kit',
                unitPrice: 30,
                priceCheck: {
                    kind: 'shopify',
                    productTitleIncludes: 'RAK10722',
                    variant: { titleIncludes: ['RAK19007', 'no additional modules', 'US915'] },
                },
            },
            {
                product: 'US915 SKU 116016',
                store: 'rokland',
                url: 'https://store.rokland.com/products/rak-wireless-wisblock-meshtastic-starter-kit',
                unitPrice: 35,
                priceCheck: {
                    kind: 'shopify',
                    productTitleIncludes: 'Starter Kit',
                    variant: { index: 0 },
                },
            },
        ],
    },
    solarPanel: {
        component: 'Solar Panel',
        detail: 'JST 1.5 connector. Sized to carry the node through a Cascade December.',
        vendors: [
            {
                product: '80 × 45 mm, SKU 920399',
                store: 'rakwireless',
                url: 'https://store.rakwireless.com/products/solar-panel',
                unitPrice: 4,
                priceCheck: { kind: 'shopify', variant: { sku: '920399' } },
            },
            {
                product: 'SKU 920399',
                store: 'rokland',
                url: 'https://store.rokland.com/products/rak-solar-panels-920399',
                unitPrice: 12,
                priceCheck: { kind: 'shopify', variant: { index: 0 } },
            },
        ],
    },
    antenna: {
        component: 'RAK 916 MHz LoRa antenna (US915)',
        detail: 'Half-wave dipole, 142 mm, 1.2 dBi, RP-SMA. Choose the 900–930 MHz variant for US915.',
        antennaGainDbi: 1.2,
        vendors: [
            {
                product: 'Original Helium Hotspot Antenna, 900–930 MHz variant',
                store: 'rakwireless',
                url: 'https://store.rakwireless.com/products/868mhz-antenna',
                unitPrice: 10,
                priceCheck: {
                    kind: 'shopify',
                    productTitleIncludes: 'Original Helium Hotspot Antenna',
                    variant: { sku: '926000' },
                },
            },
        ],
    },
    battery: {
        component: '3.7V 4400mAh 1S2P Protected Li-ion Battery Pack',
        detail: 'Two 18650 cells in parallel, protection circuit, and a 2-pin JST cable. Verify polarity and fit before connecting.',
        vendors: [
            {
                product: 'Adafruit #354, 3.7V 4400mAh',
                store: 'adafruit',
                url: 'https://www.adafruit.com/product/354',
                unitPrice: 20,
                priceCheck: { kind: 'meta-price' },
            },
            {
                product: 'Adafruit #354, SKU 1528-1834-ND',
                store: 'digikey',
                url: 'https://www.digikey.com/en/products/detail/adafruit-industries-llc/354/5054541',
                unitPrice: 20,
            },
        ],
    },
    enclosure: {
        component: 'IP65 enclosure',
        detail: 'ASA shell with a printed TPU lid gasket. STL and filament cost, not a purchase.',
        vendors: [
            {
                product: 'Printed ASA + TPU gasket',
                store: 'selfPrinted',
                url: '/build#enclosures',
                unitPrice: 2,
            },
        ],
    },
    lteModule: {
        component: 'RAK13102 Blues NoteCarrier + NoteCard',
        detail: 'LTE-M / NB-IoT backhaul with 10 years and 500 MB of included cellular data.',
        vendors: [
            {
                product: 'RAK13102 with NoteCard V1 NBGL-500, SKU 110135',
                store: 'rakwireless',
                url: 'https://store.rakwireless.com/products/wisblock-blues-notecarrier-rak13102',
                unitPrice: 77,
                priceCheck: {
                    kind: 'shopify',
                    productTitleIncludes: 'RAK13102',
                    variant: { sku: '110135' },
                },
            },
            {
                product: 'RAK13102 with NoteCard',
                store: 'kiloElectronics',
                url: 'https://kiloelectronics.com/en/produkt/rak13102-wisblock-blues-notecarrier/',
                unitPrice: 90,
            },
        ],
    },
    lteAntenna: {
        component: 'LTE antenna',
        detail: '215 mm outdoor antenna with N-Type male connector. The enclosure cable and adapter remain to be selected.',
        vendors: [
            {
                product: 'RAK LTE Antenna, SKU 920031',
                store: 'rakwireless',
                url: 'https://store.rakwireless.com/products/lte-antenna',
                unitPrice: 15,
                priceCheck: { kind: 'shopify', variant: { sku: '920031' } },
            },
            {
                product: 'RAK 3 dBi N-Type',
                store: 'connectedThings',
                url: 'https://eu.connectedthings.store/en/lorawan-gateways/gateway-accessories/rak-3dbi-4glte-cellular-antenna-n-type.html',
                unitPrice: 24,
            },
        ],
    },
    smokeSensor: {
        component: 'RAK12039 particulate matter sensor',
        detail: 'Plantower PMSA003I module for WisBlock. PM1.0, PM2.5, PM10 and particle counts.',
        measurements: [
            { title: 'Mass concentration', detail: 'PM1.0, PM2.5 and PM10.' },
            { title: 'Particle size bins', detail: '0.3–1.0, 1.0–2.5 and 2.5–10 μm.' },
        ],
        integration: [
            {
                title: 'Plug-in IO module',
                detail: 'The RAK12039 mounts in the WisBlock IO slot. Its included flex cable connects the sensor to its module board.',
            },
            {
                title: 'No external boost board',
                detail: 'The module includes a 5 V boost converter for the PMSA003I, so the sensor does not need a separately wired 5 V supply.',
            },
            {
                title: 'Vented sensor head',
                detail: 'The sensor needs a weather-shedding intake that admits outside air while keeping rain, ash and insects away from its optical path.',
            },
        ],
        vendors: [
            {
                product: 'RAK12039, SKU 110098',
                store: 'rakwireless',
                url: 'https://store.rakwireless.com/products/particle-matter-sensor-plantower-pmsa003i-rak12039',
                unitPrice: 32,
                priceCheck: { kind: 'shopify', variant: { sku: '110098' } },
            },
        ],
    },
    sensorHead: {
        component: 'Sensor-head housing + gore vent',
        detail: 'Printed particle-sensor head with a vented, water-shedding intake.',
        vendors: [
            {
                product: 'Printed ASA',
                store: 'selfPrinted',
                url: '/build#enclosures',
                unitPrice: 3,
            },
        ],
    },
    camera: {
        component: 'ESP32-S3 with OV5640 camera',
        detail: '5 MP, runs a quantised smoke classifier on-device at roughly one frame a minute.',
        vendors: [
            {
                product: 'Seeed XIAO',
                store: 'seeed',
                url: 'https://www.seeedstudio.com/XIAO-ESP32S3-Sense-p-5639.html',
                unitPrice: 26,
            },
            {
                product: 'XIAO ESP32-S3 Sense',
                store: 'amazon',
                url: 'https://www.amazon.com/Seeed-Studio-XIAO-ESP32-Sense/dp/B0C69FFVHH',
                unitPrice: 24,
            },
        ],
    },
    cameraHood: {
        component: 'Camera window + hood',
        detail: 'Printed hood with a glued acrylic window. Keeps rain off the lens.',
        vendors: [
            {
                product: 'Printed ASA + acrylic',
                store: 'selfPrinted',
                url: '/build#enclosures',
                unitPrice: 3,
            },
        ],
    },
} as const satisfies Record<string, CatalogPart>

export type PartId = keyof typeof PARTS

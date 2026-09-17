/**
 * The only place a part’s names, store links, or prices may be written.
 * Node totals and every advertised dollar figure are derived from vendor[0].
 */

import type { StoreId } from '@core/content/build/stores'
export type CatalogVendor = {
    /** Specific item in that store’s cart. */
    product: string
    /** Who sells it. Name and shipping policy live in `stores.ts`. */
    store: StoreId
    url: string
    /** USD, stored already rounded to a whole dollar. */
    unitPrice: number
}

export type CatalogPart = {
    /** Role in the build. */
    component: string
    detail: string
    /**
     * Bought parts list two storefronts. Printed parts list the filament
     * cost once. Running totals always use the first vendor.
     */
    vendors: readonly [CatalogVendor, CatalogVendor] | readonly [CatalogVendor]
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
            },
            {
                product: 'US915 SKU 116016',
                store: 'rokland',
                url: 'https://store.rokland.com/products/rak-wireless-wisblock-meshtastic-starter-kit',
                unitPrice: 35,
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
            },
            {
                product: 'SKU 920399',
                store: 'rokland',
                url: 'https://store.rokland.com/products/rak-solar-panels-920399',
                unitPrice: 12,
            },
        ],
    },
    antenna: {
        component: '915Mhz Whip Antenna for LoRa',
        detail: 'SMA male, 20 cm flexible whip. The single cheapest dB you can buy in this build.',
        vendors: [
            {
                product: 'Flexible Whip 20 cm',
                store: 'rakwireless',
                url: 'https://store.rakwireless.com/products/sma-male-915mhz-868mhz-whip-antenna-20cm',
                unitPrice: 8,
            },
            {
                product: 'Atlavox SMA whip',
                store: 'atlavox',
                url: 'https://atlavox.com/products/antenna-for-meshtastic-915mhz-sma-whip',
                unitPrice: 13,
            },
        ],
    },
    battery: {
        component: '21700 Protected Button Top 3450mAh Battery',
        detail: 'Protected button top. Protection matters — see the offline node on the map.',
        vendors: [
            {
                product: 'Panasonic NCR18650GA',
                store: 'batteryStore18650',
                url: 'https://www.18650batterystore.com/products/panasonic-ncr18650ga-3450mah-battery-protected-button-top',
                unitPrice: 11,
            },
            {
                product: 'KeepPower P1835J',
                store: 'illumn',
                url: 'https://illumn.com/18650-keeppower-3500mah-sanyo-ncr18650ga-protected-button-top.html',
                unitPrice: 10,
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
            },
            {
                product: 'RAK 3 dBi N-Type',
                store: 'connectedThings',
                url: 'https://eu.connectedthings.store/en/lorawan-gateways/gateway-accessories/rak-3dbi-4glte-cellular-antenna-n-type.html',
                unitPrice: 24,
            },
        ],
    },
    sps30: {
        component: 'Sensirion SPS30 particulate sensor',
        detail: 'PM1.0 / PM2.5 / PM10, laser scattering. Five-year rated life.',
        vendors: [
            {
                product: 'SPS30',
                store: 'mouser',
                url: 'https://www.mouser.com/en/ProductDetail/Sensirion/SPS30?qs=lc2O%252BfHJPVbEPY0RBeZmPA%3D%3D',
                unitPrice: 35,
            },
            {
                product: 'SPS30',
                store: 'digikey',
                url: 'https://www.digikey.com/en/products/detail/sensirion-ag/SPS30/7674523',
                unitPrice: 36,
            },
        ],
    },
    bme688: {
        component: 'Bosch BME688 gas + environment sensor',
        detail: 'VOC trend plus temperature, humidity and pressure. It cannot identify smoke or a specific gas on its own.',
        vendors: [
            {
                product: 'BME688',
                store: 'adafruit',
                url: 'https://www.adafruit.com/product/5046',
                unitPrice: 20,
            },
            {
                product: 'BME688 Qwiic',
                store: 'sparkfun',
                url: 'https://www.sparkfun.com/sparkfun-environmental-sensor-bme688-qwiic.html',
                unitPrice: 35,
            },
        ],
    },
    sensorHead: {
        component: 'Sensor-head housing + gore vent',
        detail: 'Printed head with a vented, water-shedding intake.',
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

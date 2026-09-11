import type { NodeType } from './network'

export type BomPart = {
  name: string
  detail: string
  sku?: string
  supplier: string
  url: string
  unitPrice: number
  quantity: number
  /** Parts shared with the Base build are marked so totals stay honest. */
  inheritedFromBase?: boolean
}

export type Bom = {
  type: NodeType
  title: string
  summary: string
  parts: readonly BomPart[]
  /** Anything not on the list: postage, printing time, hardware store bits. */
  incidentals: number
  buildMinutes: number
  confidence: 'priced' | 'estimated'
}

const BASE_PARTS: readonly BomPart[] = [
  {
    name: 'WisBlock Mini Meshtastic Starter Kit',
    detail: 'RAK19003 base board, RAK4631 core, US915. The whole radio in one part.',
    sku: 'RAK Mini Starter Kit US915',
    supplier: 'RAKwireless',
    url: 'https://store.rakwireless.com/products/wisblock-meshtastic-starter-kit',
    unitPrice: 32,
    quantity: 1,
  },
  {
    name: 'Solar panel, 5.5 × 3.5 in',
    detail: 'JST 1.5 connector. Sized to carry the node through a Cascade December.',
    sku: '920433',
    supplier: 'RAKwireless',
    url: 'https://store.rakwireless.com/products/solar-panel',
    unitPrice: 14,
    quantity: 1,
  },
  {
    name: '915 MHz whip antenna',
    detail: 'Half-wave whip. The single cheapest dB you can buy in this build.',
    supplier: 'Rokland',
    url: 'https://store.rokland.com/products/915-mhz-antenna',
    unitPrice: 10,
    quantity: 1,
  },
  {
    name: 'Samsung 50E 21700 cell',
    detail: '5000 mAh, protected button top. Protection matters — see the offline node on the map.',
    supplier: '18650 Battery Store',
    url: 'https://www.18650batterystore.com/products/samsung-50e-21700',
    unitPrice: 12,
    quantity: 1,
  },
  {
    name: 'IP65 enclosure',
    detail: 'Printed in ASA. STL and filament cost, not a purchase.',
    supplier: 'Self-printed',
    url: '/build#enclosures',
    unitPrice: 2,
    quantity: 1,
  },
]

/** Parts carried into every non-Base build. */
const inherited = BASE_PARTS.map((part) => ({ ...part, inheritedFromBase: true }))

export const BOMS: readonly Bom[] = [
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
      {
        name: 'RAK13102 WisBlock LTE-M / NB-IoT module',
        detail: 'Cat-M1 modem on the WisBlock stack. No carrier lock-in.',
        supplier: 'RAKwireless',
        url: 'https://store.rakwireless.com/products/wisblock-cellular',
        unitPrice: 36,
        quantity: 1,
      },
      {
        name: 'LTE stub antenna + pigtail',
        detail: 'u.FL to SMA, external mount through the enclosure wall.',
        supplier: 'RAKwireless',
        url: 'https://store.rakwireless.com/products/lte-antenna',
        unitPrice: 9,
        quantity: 1,
      },
      {
        name: 'IoT data SIM, 12 months',
        detail: 'Low-rate M2M plan. Roughly 30 MB per month at the current packet rate.',
        supplier: 'Hologram / Soracom',
        url: 'https://www.hologram.io/pricing/',
        unitPrice: 3,
        quantity: 1,
      },
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
      {
        name: 'Sensirion SPS30 particulate sensor',
        detail: 'PM1.0 / PM2.5 / PM10, laser scattering. Five-year rated life.',
        supplier: 'Mouser',
        url: 'https://www.mouser.com/c/?q=SPS30',
        unitPrice: 42,
        quantity: 1,
      },
      {
        name: 'Bosch BME688 gas + environment sensor',
        detail: 'VOC and temperature/humidity, for discriminating smoke from fog.',
        supplier: 'Adafruit',
        url: 'https://www.adafruit.com/product/5046',
        unitPrice: 19,
        quantity: 1,
      },
      {
        name: 'Sensor-head housing + gore vent',
        detail: 'Printed head with a vented, water-shedding intake.',
        supplier: 'Self-printed',
        url: '/build#enclosures',
        unitPrice: 3,
        quantity: 1,
      },
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
      {
        name: 'ESP32-S3 with OV5640 camera',
        detail: '5 MP, runs a quantised smoke classifier on-device at roughly one frame a minute.',
        supplier: 'Seeed Studio',
        url: 'https://www.seeedstudio.com/xiao-series-page',
        unitPrice: 26,
        quantity: 1,
      },
      {
        name: 'Second 21700 cell + holder',
        detail: 'Vision duty cycle roughly doubles the daily budget.',
        supplier: '18650 Battery Store',
        url: 'https://www.18650batterystore.com/products/samsung-50e-21700',
        unitPrice: 15,
        quantity: 1,
      },
      {
        name: 'Second solar panel',
        detail: 'Paired with the extra cell to survive a week of Pacific Northwest overcast.',
        sku: '920433',
        supplier: 'RAKwireless',
        url: 'https://store.rakwireless.com/products/solar-panel',
        unitPrice: 14,
        quantity: 1,
      },
      {
        name: 'Camera window + hood',
        detail: 'Printed hood with a glued acrylic window. Keeps rain off the lens.',
        supplier: 'Self-printed',
        url: '/build#enclosures',
        unitPrice: 3,
        quantity: 1,
      },
    ],
    incidentals: 0,
    buildMinutes: 90,
    confidence: 'estimated',
  },
]

export function bomTotal(bom: Bom): number {
  return bom.parts.reduce((sum, part) => sum + part.unitPrice * part.quantity, 0) + bom.incidentals
}

export function bomFor(type: NodeType): Bom {
  const found = BOMS.find((bom) => bom.type === type)
  if (!found) throw new Error(`No bill of materials for node type "${type}"`)
  return found
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

export const DOWNLOADS: readonly Download[] = [
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
]

export type AssemblyStep = {
  title: string
  detail: string
  minutes: number
}

export const ASSEMBLY: readonly AssemblyStep[] = [
  {
    title: 'Flash the firmware',
    detail:
      'Connect the RAK4631 over USB and flash from the Meshtastic web installer in Chrome. No toolchain, no drivers on macOS or Linux.',
    minutes: 5,
  },
  {
    title: 'Load the config preset',
    detail:
      'Import the JSON for the node type you are building. It sets region US915, the long-fast preset, hop limit 5, and the telemetry intervals.',
    minutes: 3,
  },
  {
    title: 'Print the shell',
    detail:
      'ASA at 0.2 mm, four walls, 30% infill. PLA will fail in a sunlit enclosure by the second summer — this is the one material substitution that matters.',
    minutes: 0,
  },
  {
    title: 'Fit the cell and panel',
    detail:
      'Cell into the holder, panel lead through the grommet, silicone the pass-through. Check polarity twice; the board has no reverse protection.',
    minutes: 8,
  },
  {
    title: 'Seal and soak-test',
    detail:
      'Close the shell, then leave it outdoors for 48 hours before you carry it anywhere remote. Most failures show up in the first two days.',
    minutes: 5,
  },
  {
    title: 'Mount and confirm',
    detail:
      'Get the antenna as high as the site allows and vertical. Confirm the node appears on the map and that its first hop shows SNR above 4 dB.',
    minutes: 20,
  },
]

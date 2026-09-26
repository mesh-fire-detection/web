import type { BuildContent } from '@core/content/types'

import { placement } from './placement'

export const buildContent = {
    title: 'Build a node',
    eyebrow: 'Bill of materials · STLs · firmware',
    lede: 'Every part, every price, every file. Nothing behind a form, nothing that needs an email. Prototype sections state their unanswered engineering questions instead of hiding them.',
    jumpCta: 'Jump to the parts list',
    sourceCta: 'Source',
    nodeTypes: {
        eyebrow: 'Node types',
        title: 'Pick what you are building',
        lede: 'Every node type is a Base node with something added. Build a Base first — it is the cheapest way to find out whether your site works at all.',
    },
    bom: {
        eyebrow: 'Bill of materials',
        title: 'Part, stores, price, running total',
        lede: 'The running total uses the first store. A second listing is shown where one is available. Prices are in USD, before shipping and tax, on the date shown. Where a part is not settled, the table says estimated rather than pretending otherwise.',
        substitutionTitle: 'One substitution will cost you a node',
        substitutionBody:
            'Print the shell in ASA, not PLA. A PLA enclosure in direct sun softens and warps by its second summer, and every seal on it fails at once. It is the single most common way a build of this kind dies quietly a year after you install it.',
        pricesCheckedOn: '2026-09-25',
        orders: {
            label: 'Orders',
            title: 'What you actually check out',
            lede: 'The unit cost above is the cheapest price for each line. Nobody can buy that basket in one go — the parts come from several storefronts, and each one charges postage separately.',
            freeOver: 'free over {amount}',
            freeOverMet: 'free — this basket clears {amount}',
            flat: '{amount} a shipment, any basket size',
            from: 'from {amount}',
            checkout: 'quoted at checkout',
            none: 'printed, not shipped',
        },
        shippingTitle: 'The sticker price is not the landed price',
        shippingBody:
            'Every figure on this page excludes shipping and sales tax, because both depend on where you are. What we can tell you is the shape of the bill: a Base node is two orders, and ordering from RAK directly adds international freight plus a customs duty they state is yours to pay. That is why a US reseller at a higher sticker price can still be cheaper in the cart — and why buying parts for several nodes at once is the one discount available to everybody.',
    },
    enclosures: {
        eyebrow: 'Enclosures',
        title: 'STLs, hosted here',
        lede: 'Printed in ASA at 0.2 mm, four walls, 30% infill, with the lid gasket in TPU. No supports on any part. Print times assume a 0.4 mm nozzle.',
        unpublished:
            'The enclosure geometry is not published yet. Rather than serve you a file that is not there, these link to the hardware repository — the print settings below are current, the meshes are not.',
        printTitle: 'Print settings',
        print: [
            { term: 'Material', value: 'ASA. ABS works; PLA does not.' },
            { term: 'Layer height', value: '0.2 mm' },
            { term: 'Walls', value: '4 perimeters, 30% gyroid infill' },
            { term: 'Supports', value: 'None required in the shipped orientation' },
            {
                term: 'Lid gasket',
                value: 'TPU 95A, printed flat and seated in the lid groove. Sized for about 25% compression, so the lid needs real force to close.',
            },
            {
                term: 'Post-processing',
                value: 'Silicone the cable pass-through, seat the gasket, and insulate the cell leads. Nothing else.',
            },
        ],
        ipTitle: 'What IP65 means here',
        ipBody: 'Dust-tight and rated against low-pressure water jets from any direction. It is a design target for these parts, not a certification — nobody has taken one of these shells to a test house.',
        ipWarn: 'Soak-test every node outdoors for 48 hours before you carry it somewhere remote.',
    },
    firmware: {
        eyebrow: 'Firmware & config',
        title: 'Meshtastic presets as downloadable JSON',
        lede: 'Flash from the Meshtastic web installer, then import the preset for your node type. No toolchain, no build step, no drivers on macOS or Linux.',
        presetsTitle: 'Radio presets, and what each one costs you',
        presetsNote:
            'The network runs Long / Fast. Slower presets buy range and spend airtime — and airtime is the thing that caps how many nodes a branch can carry.',
    },
    rak12039: {
        eyebrow: 'RAK12039 particulate sensor',
        title: 'A WisBlock module that fits the Sensor node',
        lede: 'RAK12039 uses the Plantower PMSA003I to measure PM1.0, PM2.5 and PM10. The module plugs into the RAK19007 IO slot and includes the conversion needed to power the sensor.',
        requirementsTitle: 'How the particulate sensor fits',
        requirements: [
            {
                title: 'Plug-in IO module',
                detail: 'The RAK12039 mounts in the WisBlock IO slot. Its included flex cable connects the sensor to its module board.',
            },
            {
                title: 'No external boost board',
                detail: 'The RAK12039 module includes a 5 V boost converter for the PMSA003I, so the sensor does not need a separately wired 5 V supply.',
            },
            {
                title: 'Vented sensor head',
                detail: 'The sensor still needs a weather-shedding intake that admits outside air while keeping rain, ash and insects away from its optical path.',
            },
        ],
        measurementsTitle: 'What it measures',
        measurements: [
            { title: 'Mass concentration', detail: 'PM1.0, PM2.5 and PM10.' },
            { title: 'Particle size bins', detail: '0.3–1.0, 1.0–2.5 and 2.5–10 μm.' },
        ],
        firmwareTitle: 'The preset does not add particulate telemetry',
        firmwareBody:
            'The downloadable Meshtastic preset configures the radio; it does not read the RAK12039. Firmware support, power use on the one-cell node and PM telemetry still need a hardware test.',
        questionsTitle: 'Questions the first prototype must answer',
        questions: [
            'Which interval — 1, 5, 15 or 60 minutes — gives a useful signal without exhausting the energy budget?',
            'How does the RAK12039 behave in cold, humid air and after repeated sleep cycles?',
            'Does the intake remain dry and unobstructed through rain, dust, ash and insects?',
            'Does ground-level particulate matter distinguish wildfire smoke from fog, road dust and a nearby burn pile early enough to help?',
        ],
        readyTitle: 'What makes RAK12039 a supported component',
        ready: [
            'A cold boot and deep-sleep cycle repeatedly find the sensor and publish PM1.0, PM2.5 and PM10.',
            'A 72-hour power test records current, solar input and battery state at the chosen interval without I²C or radio failures.',
            'The sensor-head design survives a wet outdoor test and its files and firmware source are published.',
            'A controlled-burn or equivalent field test publishes raw PM, weather and power data alongside the result.',
        ],
    },
    assembly: {
        eyebrow: 'Assembly',
        title: 'Base build: six steps, about an hour',
    },
    placement: {
        eyebrow: 'Placement',
        title: 'Where the node goes matters more than what is in it',
        items: placement,
        coverageCta: 'Check your site in the coverage calculator',
    },
    before: {
        eyebrow: 'Before you deploy',
        title: 'Three things that are not our problem to answer for you',
        items: [
            {
                lead: 'Permission.',
                body: "Get it in writing from whoever owns the ground. A node on someone else's ridge is their node, legally and practically.",
            },
            {
                lead: 'Radio rules.',
                body: 'US915 under FCC Part 15 caps radiated power. The presets ship compliant; if you change power or antenna gain, that is on you.',
            },
            {
                lead: 'Wilderness.',
                body: 'Designated wilderness has rules about installed equipment that predate all of this. Read them before you carry hardware in.',
            },
        ],
    },
} as const satisfies BuildContent

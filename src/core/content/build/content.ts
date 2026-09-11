import type { BuildContent } from '@core/content/types'

import { placement } from './placement'

export const buildContent = {
    title: 'Build a node',
    eyebrow: 'Bill of materials · STLs · firmware',
    lede: 'Every part, every price, every file. Nothing behind a form, nothing that needs an email. If you have to ask us a question to finish a node, this page has a bug in it.',
    jumpCta: 'Jump to the parts list',
    sourceCta: 'Source',
    nodeTypes: {
        eyebrow: 'Node types',
        title: 'Pick what you are building',
        lede: 'Every node type is a Base node with something added. Build a Base first — it is the cheapest way to find out whether your site works at all.',
    },
    bom: {
        eyebrow: 'Bill of materials',
        title: 'Part, supplier, price, running total',
        lede: 'Prices are what the supplier listed on the date shown, in USD, before shipping and tax. Where a part is not settled, the table says estimated rather than pretending otherwise.',
        substitutionTitle: 'One substitution will cost you a node',
        substitutionBody:
            'Print the shell in ASA, not PLA. A PLA enclosure in direct sun softens and warps by its second summer, and every seal on it fails at once. It is the single most common way a build of this kind dies quietly a year after you install it.',
    },
    enclosures: {
        eyebrow: 'Enclosures',
        title: 'STLs, hosted here',
        lede: 'Printed in ASA at 0.2 mm, four walls, 30% infill. No supports on any part. Print times assume a 0.4 mm nozzle.',
        unpublished:
            'The enclosure geometry is not published yet. Rather than serve you a file that is not there, these link to the hardware repository — the print settings below are current, the meshes are not.',
        printTitle: 'Print settings',
        print: [
            { term: 'Material', value: 'ASA. ABS works; PLA does not.' },
            { term: 'Layer height', value: '0.2 mm' },
            { term: 'Walls', value: '4 perimeters, 30% gyroid infill' },
            { term: 'Supports', value: 'None required in the shipped orientation' },
            { term: 'Post-processing', value: 'Silicone the cable pass-through; nothing else' },
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
    assembly: {
        eyebrow: 'Assembly',
        title: 'Six steps, about an hour',
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

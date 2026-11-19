import { describe, expect, it } from 'vitest'

import {
    heardViaText,
    listNodes,
    nodeUse,
    powerText,
    readFilters,
    toggleSort,
    writeFilters,
    type Filters,
} from '@components/pages/nodes/listing'

import { BENCH, GATE, RIDGE } from './fixtures'

const NONE: Filters = readFilters(new URLSearchParams())
const ids = (filters: Partial<Filters>) =>
    listNodes([RIDGE, BENCH, GATE], { ...NONE, ...filters }, Date.now()).map((node) => node.id)

describe('node list filters', () => {
    it('round-trips through the URL, writing only what differs from the default', () => {
        const filters: Filters = {
            mine: true,
            role: 'sensor',
            status: 'offline',
            query: 'ridge',
            sort: 'heard',
            direction: 'descending',
        }

        const written = writeFilters(filters)

        expect(written.toString()).toBe(
            'mine=1&role=sensor&status=offline&q=ridge&sort=heard&dir=desc'
        )
        expect(readFilters(written)).toEqual(filters)
        expect(writeFilters(NONE).toString()).toBe('')
    })

    it('reads a link from before roles, where cellular meant a gateway', () => {
        expect(readFilters(new URLSearchParams('type=cellular')).role).toBe('gateway')
        expect(readFilters(new URLSearchParams('type=sensor')).role).toBe('sensor')
    })

    it('ignores what it does not recognise in the URL', () => {
        expect(
            readFilters(new URLSearchParams('role=boat&type=boat&status=gone&sort=colour&mine=yes'))
        ).toEqual(NONE)
    })

    it('narrows by mine, role, status and a search over ID and name', () => {
        expect(ids({ mine: true })).toEqual(['n-0001'])
        expect(ids({ role: 'gateway' })).toEqual(['cel-01'])
        // A node can have more than one role.
        expect(ids({ role: 'sensor' })).toEqual(['sen-01', 'cel-01'])
        expect(ids({ status: 'offline' })).toEqual(['n-0001'])
        expect(ids({ query: 'SEN-0' })).toEqual(['sen-01'])
        expect(ids({ query: 'truck' })).toEqual(['cel-01'])
    })

    it('puts the quiet nodes first: by status ascending, by last heard descending', () => {
        expect(ids({ sort: 'status' })).toEqual(['n-0001', 'cel-01', 'sen-01'])
        // Never heard from is the quietest of all.
        expect(ids({ sort: 'heard', direction: 'descending' })).toEqual([
            'n-0001',
            'cel-01',
            'sen-01',
        ])
    })

    it('keeps missing values last whichever way a column runs', () => {
        // Plugged in ranks above any battery level.
        expect(ids({ sort: 'battery' })).toEqual(['sen-01', 'cel-01', 'n-0001'])
        expect(ids({ sort: 'battery', direction: 'descending' })).toEqual([
            'cel-01',
            'sen-01',
            'n-0001',
        ])
    })

    it('reverses a column pressed twice, and starts a new one ascending', () => {
        const once = toggleSort(NONE, 'heard')
        const twice = toggleSort(once, 'heard')

        expect(once).toMatchObject({ sort: 'heard', direction: 'ascending' })
        expect(twice).toMatchObject({ sort: 'heard', direction: 'descending' })
        expect(toggleSort(twice, 'name')).toMatchObject({ sort: 'name', direction: 'ascending' })
    })
})

describe('status and power words', () => {
    it('says how a node was last heard', () => {
        expect(heardViaText(null)).toBeNull()
        expect(heardViaText({ via: 'browser', gateway: null, network: null })).toBe('via browser')
        expect(
            heardViaText({ via: 'gateway', gateway: { id: 'n-0005', name: 'Gate' }, network: null })
        ).toBe('via Gate')
        expect(heardViaText({ via: 'notecard', gateway: null, network: 'cellular' })).toBe(
            'via Cellular'
        )
    })

    it('shows plugged in and a battery level together', () => {
        const power = { pluggedIn: false, charging: false, at: null } as const
        expect(powerText(null)).toEqual({ text: '—', tone: 'faint' })
        expect(powerText({ ...power, batteryPct: 64, battery: 'ok' })).toEqual({
            text: '64%',
            tone: 'default',
        })
        expect(powerText({ ...power, pluggedIn: true, batteryPct: 95, battery: 'ok' })).toEqual({
            text: 'Plugged in · 95%',
            tone: 'live',
        })
        expect(
            powerText({ ...power, pluggedIn: true, batteryPct: null, battery: 'none' }).text
        ).toBe('Plugged in · No battery')
        expect(powerText({ ...power, batteryPct: 12, battery: 'low' })).toEqual({
            text: 'Battery low · 12%',
            tone: 'dead',
        })
        expect(powerText({ ...power, charging: true, batteryPct: 61, battery: 'ok' }).text).toBe(
            'Charging · 61%'
        )
    })
})

describe('what a node is doing', () => {
    const heard = {
        enabled: true,
        lastHeardAt: new Date().toISOString(),
        status: 'online',
    } as const

    it('is in the field when a gateway heard it, and on a computer when a browser did', () => {
        expect(nodeUse({ ...heard, heardVia: GATE.heardVia })).toBe('field')
        expect(
            nodeUse({ ...heard, heardVia: { via: 'browser', gateway: null, network: null } })
        ).toBe('computer')
        // Someone not on the node is not told about the browser.
        expect(nodeUse({ ...heard, heardVia: null })).toBe('recent')
    })

    it('is quiet when offline, and unused when never heard', () => {
        expect(nodeUse({ ...heard, status: 'offline', heardVia: GATE.heardVia })).toBe('quiet')
        expect(nodeUse({ ...heard, lastHeardAt: null, heardVia: null })).toBe('unused')
    })
})

import { describe, expect, it } from 'vitest'

import {
    expectedText,
    heardViaText,
    listNodes,
    nodeUse,
    powerText,
    readFilters,
    toggleSort,
    writeFilters,
    type Filters,
} from '@components/pages/nodes/listing'
import type { Node } from '@core/api/nodes'
import { nodeContent } from '@core/content/nodes/node'

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
        const heard = (heardVia: Node['heardVia']) => heardViaText({ heardVia, status: 'online' })
        expect(heard(null)).toBeNull()
        expect(heard({ via: 'browser', gateway: null, network: null })).toBe('via browser')
        expect(
            heard({ via: 'gateway', gateway: { id: 'n-0005', name: 'Gate' }, network: null })
        ).toBe('via Gate')
        expect(heard({ via: 'notecard', gateway: null, network: 'cellular' })).toBe('via Cellular')
    })

    it('says an offline node was last heard that way, not that it is now', () => {
        const heardVia = {
            via: 'gateway',
            gateway: { id: 'n-0005', name: 'Gate' },
            network: null,
        } as const
        expect(heardViaText({ heardVia, status: 'late' })).toBe('via Gate')
        expect(heardViaText({ heardVia, status: 'offline' })).toBe('last via Gate')
    })

    it('shows plugged in and a battery level together', () => {
        const power = { pluggedIn: false, charging: false, at: null } as const
        const online = (p: Parameters<typeof powerText>[0]['power']) =>
            powerText({ power: p, status: 'online' }, 0)
        expect(online(null)).toEqual({ text: '—', tone: 'faint' })
        expect(online({ ...power, batteryPct: 64, battery: 'ok' })).toEqual({
            text: '64%',
            tone: 'default',
        })
        expect(online({ ...power, pluggedIn: true, batteryPct: 95, battery: 'ok' })).toEqual({
            text: 'Plugged in · 95%',
            tone: 'live',
        })
        expect(online({ ...power, pluggedIn: true, batteryPct: null, battery: 'none' }).text).toBe(
            'Plugged in · No battery'
        )
        expect(online({ ...power, batteryPct: 12, battery: 'low' })).toEqual({
            text: 'Battery low · 12%',
            tone: 'dead',
        })
        expect(online({ ...power, charging: true, batteryPct: 61, battery: 'ok' }).text).toBe(
            'Charging · 61%'
        )
    })

    it('gives an offline node only the level it last reported, and when', () => {
        const now = Date.parse('2026-11-19T03:45:00Z')
        const offline = (p: Parameters<typeof powerText>[0]['power']) =>
            powerText({ power: p, status: 'offline' }, now)
        const at = '2026-11-19T00:44:30Z'
        expect(
            offline({ pluggedIn: true, charging: false, batteryPct: 100, battery: 'ok', at })
        ).toEqual({ text: '100% · 3 h ago', tone: 'faint' })
        expect(
            offline({ pluggedIn: false, charging: false, batteryPct: 12, battery: 'low', at }).text
        ).toBe('12% · 3 h ago')
        expect(
            offline({ pluggedIn: true, charging: false, batteryPct: null, battery: 'none', at })
                .text
        ).toBe('No battery · 3 h ago')
        // Always plugged in by its people, with nothing reported: nothing to say.
        expect(
            offline({
                pluggedIn: true,
                charging: false,
                batteryPct: null,
                battery: 'unknown',
                at: null,
            })
        ).toEqual({ text: '—', tone: 'faint' })
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

describe('when a node is expected', () => {
    const words = nodeContent.expected

    it('says how often, where that comes from, when it turns late, and any cellular delay', () => {
        expect(
            expectedText(
                {
                    intervalMin: 30,
                    source: 'configured',
                    delayMin: 0,
                    lateMin: 75,
                    offlineMin: 180,
                },
                words
            )
        ).toBe('Every 30 min, as set on the node · late after 1 h 15 min')
        expect(
            expectedText(
                { intervalMin: 5, source: 'observed', delayMin: 2, lateMin: 15, offlineMin: 32 },
                words
            )
        ).toBe('Every 5 min, as it has been reporting · late after 15 min · cellular delay 2 min')
        expect(expectedText(undefined, words)).toBeNull()
    })
})

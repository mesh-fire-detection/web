import { describe, expect, it } from 'vitest'

import { satelliteRangeResults } from '@core/satellite/rangeResults'
import {
    appendLine,
    asPacket,
    EMPTY_LOG,
    firmwareSupportsSatelliteControls,
    latest,
    satellitePasses,
    satelliteProfiles,
    satelliteStats,
    satelliteTles,
    startReplay,
    toJsonLines,
} from '@core/satellite/records'
import type { ReceiverLog } from '@core/satellite/records'

const packet = (t: number, hex = 'A1B2') =>
    JSON.stringify({ t, type: 'pkt', st: 0, len: 2, rssi: -121.5, snr: -6.25, df: 7340, hex })

function feed(log: ReceiverLog, lines: readonly string[], now: number): ReceiverLog {
    let current = log
    for (const line of lines) current = appendLine(current, line, now).log
    return current
}

describe('satellite receiver records', () => {
    it('keeps JSON records and ignores notes, malformed lines and records without type or uptime', () => {
        const log = feed(
            EMPTY_LOG,
            [
                '# coconut-rx: begin: 0',
                '{not json',
                '{"type":"hb"}',
                '[1,2]',
                '{"t":1000,"type":"boot","radio":0}',
            ],
            50_000
        )
        expect(log.entries.map((entry) => entry.type)).toEqual(['boot'])
    })

    it('dates records from the board uptime once a live record fixes the clock', () => {
        const now = 1_700_000_000_000
        const log = feed(EMPTY_LOG, ['{"t":60000,"type":"status","radio":0}', packet(30_000)], now)
        expect(log.offset).toBe(now - 60_000)
        expect(log.entries[1]?.at).toBe(now - 30_000)
    })

    it('reports a live packet, marks replayed packets and drops ones already seen', () => {
        const live = appendLine(EMPTY_LOG, packet(5000), 10_000)
        expect(live.livePacket?.type).toBe('pkt')

        const replay = startReplay(live.log)
        const duplicate = appendLine(replay, packet(5000), 20_000)
        expect(duplicate.log.entries).toHaveLength(1)
        expect(duplicate.livePacket).toBeNull()

        const older = appendLine(duplicate.log, packet(4000, 'FF'), 20_000)
        expect(older.livePacket).toBeNull()
        expect(older.log.entries.at(-1)?.replayed).toBe(true)

        const closed = appendLine(older.log, '{"t":21000,"type":"history","count":2}', 21_000)
        expect(closed.log.replaying).toBe(false)
        expect(appendLine(closed.log, packet(22_000, '00'), 22_000).livePacket).not.toBeNull()
    })

    it('dates stored packets by their own time, by this boot, or not at all', () => {
        const now = 1_800_000_000_000
        const log = feed(
            EMPTY_LOG,
            [
                '{"t":60000,"type":"status","boot":7,"radio":0}',
                '{"t":1000,"type":"pkt","boot":5,"time":1799990000000,"st":0,"hex":"01"}',
                '{"t":2000,"type":"pkt","boot":6,"st":0,"hex":"02"}',
                '{"t":3000,"type":"pkt","boot":7,"st":0,"hex":"03"}',
            ],
            now
        )
        const replayed = feed(
            startReplay(log),
            ['{"t":2000,"type":"pkt","boot":6,"st":0,"hex":"02"}'],
            now
        )
        expect(log.entries.map((entry) => entry.at)).toEqual([
            now,
            1_799_990_000_000,
            now,
            now - 57_000,
        ])
        expect(replayed.entries).toHaveLength(4)
        const unsynced = feed(
            startReplay(EMPTY_LOG),
            ['{"t":2000,"type":"pkt","boot":6,"st":0,"hex":"04"}'],
            now
        )
        expect(unsynced.entries[0]?.at).toBeNull()
        expect(toJsonLines(unsynced)).not.toContain('"at"')
    })

    it('reads packet fields and finds the latest record of a type', () => {
        const log = feed(
            EMPTY_LOG,
            ['{"t":1,"type":"hb","noise":-120}', packet(2), '{"t":3,"type":"hb","noise":-118}'],
            10
        )
        const entry = log.entries[1]
        expect(entry && asPacket(entry)).toEqual({
            status: 0,
            length: 2,
            rssi: -121.5,
            snr: -6.25,
            frequencyError: 7340,
            frequency: NaN,
            hex: 'A1B2',
        })
        expect(latest(log, 'hb')?.fields['noise']).toBe(-118)
        expect(latest(log, 'status')).toBeNull()
    })

    it('exports JSON Lines with an ISO receive time on each record', () => {
        const log = feed(EMPTY_LOG, ['{"t":0,"type":"boot","radio":0}'], Date.UTC(2026, 9, 23))
        expect(toJsonLines(log)).toBe(
            '{"at":"2026-10-23T00:00:00.000Z","t":0,"type":"boot","radio":0}'
        )
    })

    it('selects the latest profile, statistics, passes, and TLE inventory records', () => {
        const log = feed(
            EMPTY_LOG,
            [
                '{"t":1,"type":"status","fw":"0.0.1","mode":"auto"}',
                '{"t":2,"type":"profile","id":"coconut","norad":98292,"name":"Coconut","freq":437.4,"bw":62.5,"sf":10,"confidence":"published"}',
                '{"t":3,"type":"stats","profile":"coconut","pkts":1,"crc_err":0,"cad":2,"cad_false":1,"last_t":2,"last_rssi":-110}',
                '{"t":4,"type":"stats","profile":"coconut","pkts":3,"crc_err":1,"cad":4,"cad_false":2,"last_t":4,"last_rssi":-105}',
                '{"t":5,"type":"pass","norad":98292,"profile":"coconut","aos":100,"tca":200,"los":300,"max_el":42,"tle_age_d":1,"stale":false}',
                '{"t":6,"type":"tle","norad":98292,"epoch":10,"age_d":2,"present":true}',
                '{"t":7,"type":"tle","norad":98292,"epoch":null,"age_d":null,"present":false}',
            ],
            10
        )
        expect(firmwareSupportsSatelliteControls(log)).toBe(true)
        expect(satelliteProfiles(log)[0]?.name).toBe('Coconut')
        expect(satelliteStats(log)[0]?.packets).toBe(3)
        expect(satellitePasses(log)[0]?.maximumElevation).toBe(42)
        expect(satelliteTles(log)[0]?.present).toBe(false)
    })

    it('aggregates Range Scan results and sorts by packets, CAD hits, and RSSI', () => {
        const log = feed(
            EMPTY_LOG,
            [
                '{"t":1,"type":"cad","profile":"coconut","result":"detected"}',
                '{"t":10,"type":"cad","freq":437.1,"bw":62.5,"sf":7,"result":"detected"}',
                '{"t":20,"type":"cad","freq":437.1,"bw":62.5,"sf":7,"result":"timeout"}',
                '{"t":30,"type":"cad","freq":437.2,"bw":125,"sf":8,"result":"detected"}',
                '{"t":40,"type":"cad","freq":437.2,"bw":125,"sf":8,"result":"pkt"}',
                '{"t":39,"type":"pkt","mode":"range","freq":437.2,"st":0,"rssi":-110}',
                '{"t":50,"type":"cad","freq":437.1,"bw":62.5,"sf":7,"result":"pkt"}',
                '{"t":49,"type":"pkt","mode":"range","freq":437.1,"st":0,"rssi":-103}',
                '{"t":60,"type":"cad","freq":437.1,"bw":62.5,"sf":7,"result":"error"}',
                '{"t":59,"type":"pkt","mode":"range","freq":437.1,"st":-7,"rssi":-112}',
            ],
            10
        )
        expect(satelliteRangeResults(log)).toEqual([
            {
                frequencyMHz: 437.1,
                bandwidthKHz: 62.5,
                spreadingFactor: 7,
                cadHits: 1,
                packets: 1,
                timeouts: 1,
                crcErrors: 1,
                errors: 1,
                bestRssi: -103,
                lastRssi: -112,
                lastUptime: 59,
            },
            {
                frequencyMHz: 437.2,
                bandwidthKHz: 125,
                spreadingFactor: 8,
                cadHits: 1,
                packets: 1,
                timeouts: 0,
                crcErrors: 0,
                errors: 0,
                bestRssi: -110,
                lastRssi: -110,
                lastUptime: 39,
            },
        ])
    })

    it('keeps new controls hidden for an older firmware status', () => {
        const log = feed(EMPTY_LOG, ['{"t":1,"type":"status","radio":0}'], 10)
        expect(firmwareSupportsSatelliteControls(log)).toBe(false)
    })
})

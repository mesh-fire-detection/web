import { numberField, PACKET_CRC_MISMATCH, textField } from '@core/satellite/records'
import type { ReceiverLog, SatelliteRangeResult } from '@core/satellite/records'

type MutableRangeResult = {
    frequencyMHz: number
    bandwidthKHz: number
    spreadingFactor: number
    cadHits: number
    packets: number
    timeouts: number
    crcErrors: number
    errors: number
    bestRssi: number | null
    lastRssi: number | null
    lastUptime: number
}

type PendingRangePacket = { readonly key: string; readonly uptime: number }

export function satelliteRangeResults(log: ReceiverLog): readonly SatelliteRangeResult[] {
    const results = new Map<string, MutableRangeResult>()
    let pendingPacket: PendingRangePacket | null = null
    for (const entry of log.entries) {
        if (entry.type === 'cad') {
            const frequencyMHz = numberField(entry.fields, 'freq')
            const bandwidthKHz = numberField(entry.fields, 'bw')
            const spreadingFactor = numberField(entry.fields, 'sf')
            if (frequencyMHz === null || bandwidthKHz === null || spreadingFactor === null) {
                pendingPacket = null
                continue
            }
            const key = `${frequencyMHz.toFixed(4)}:${bandwidthKHz}:${String(spreadingFactor)}`
            let result = results.get(key)
            if (!result) {
                result = {
                    frequencyMHz,
                    bandwidthKHz,
                    spreadingFactor,
                    cadHits: 0,
                    packets: 0,
                    timeouts: 0,
                    crcErrors: 0,
                    errors: 0,
                    bestRssi: null,
                    lastRssi: null,
                    lastUptime: entry.uptime,
                }
                results.set(key, result)
            }
            result.lastUptime = entry.uptime
            pendingPacket = recordRangeOutcome(
                result,
                textField(entry.fields, 'result'),
                key,
                entry.uptime
            )
            continue
        }

        if (entry.type !== 'pkt' || textField(entry.fields, 'mode') !== 'range') continue
        const frequencyMHz = numberField(entry.fields, 'freq')
        const status = numberField(entry.fields, 'st')
        const rssi = numberField(entry.fields, 'rssi')
        if (
            !pendingPacket ||
            frequencyMHz === null ||
            status === null ||
            rssi === null ||
            Math.abs(entry.uptime - pendingPacket.uptime) > 250
        ) {
            pendingPacket = null
            continue
        }
        const result = results.get(pendingPacket.key)
        if (!result || Math.abs(result.frequencyMHz - frequencyMHz) > 0.0001) {
            pendingPacket = null
            continue
        }
        result.lastRssi = rssi
        result.bestRssi = result.bestRssi === null ? rssi : Math.max(result.bestRssi, rssi)
        result.lastUptime = entry.uptime
        if (status === PACKET_CRC_MISMATCH) result.crcErrors++
        pendingPacket = null
    }

    return Array.from(results.values(), (result) => result).toSorted(
        (left, right) =>
            right.packets - left.packets ||
            right.cadHits - left.cadHits ||
            (right.bestRssi ?? -Infinity) - (left.bestRssi ?? -Infinity) ||
            left.frequencyMHz - right.frequencyMHz
    )
}

function recordRangeOutcome(
    result: MutableRangeResult,
    outcome: string | null,
    key: string,
    uptime: number
): PendingRangePacket | null {
    switch (outcome) {
        case 'detected': {
            result.cadHits++
            return null
        }
        case 'timeout': {
            result.timeouts++
            return null
        }
        case 'pkt': {
            result.packets++
            return { key, uptime }
        }
        case 'error': {
            result.errors++
            return { key, uptime }
        }
        case null: {
            return null
        }
        default: {
            return null
        }
    }
}

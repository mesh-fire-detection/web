import { validTleLine } from '@core/satellite/tle'

export type SatelliteMode = 'auto' | 'scan' | 'fixed' | 'range'

export type RangeCommandOptions = {
    readonly startMHz: number
    readonly endMHz: number
    readonly bandwidthsKHz: readonly number[]
    readonly spreadingFactors: readonly number[]
    readonly cadSymbols: number
    readonly rxTimeoutMs: number
}

export type RangeScanEstimate = { readonly combinations: number; readonly durationMs: number }

export function rangeScanEstimate(options: RangeCommandOptions): RangeScanEstimate {
    let durationMs = 0
    let combinations = 0
    for (const bandwidthKHz of options.bandwidthsKHz) {
        const bandwidthHz = bandwidthKHz * 1000
        const frequencyCount =
            Math.floor(((options.endMHz - options.startMHz) * 1_000_000) / (bandwidthHz / 2)) + 1
        combinations += frequencyCount * options.spreadingFactors.length
        for (const spreadingFactor of options.spreadingFactors) {
            const symbolMs = (2 ** spreadingFactor * 1000) / bandwidthHz
            durationMs += Math.ceil(symbolMs * options.cadSymbols) * frequencyCount
        }
    }
    return { combinations, durationMs }
}

export function modeCommand(mode: 'auto' | 'scan'): string {
    return `mode ${mode}`
}

export function minimumElevationCommand(degrees: number): string {
    if (!Number.isSafeInteger(degrees) || degrees < 0 || degrees > 90)
        throw new Error('Minimum elevation must be an integer from 0 to 90 degrees')
    return `min_el ${degrees}`
}

export function dopplerCommand(enabled: boolean): string {
    return `doppler ${enabled ? 'on' : 'off'}`
}

export function fixedModeCommand(profileId: string): string {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(profileId)) throw new Error('Invalid profile id')
    return `mode fixed ${profileId}`
}

export function rangeModeCommand(options: RangeCommandOptions): string {
    const { startMHz, endMHz, bandwidthsKHz, spreadingFactors, cadSymbols, rxTimeoutMs } = options
    if (
        !Number.isFinite(startMHz) ||
        !Number.isFinite(endMHz) ||
        startMHz < 435 ||
        endMHz > 438 ||
        startMHz >= endMHz
    )
        throw new Error('Frequency range must be within 435–438 MHz')
    if (
        bandwidthsKHz.length === 0 ||
        bandwidthsKHz.length > 4 ||
        bandwidthsKHz.some((value) => ![62.5, 125, 250].includes(value))
    )
        throw new Error('Range Scan needs one to four supported bandwidths')
    if (
        spreadingFactors.length === 0 ||
        spreadingFactors.length > 6 ||
        spreadingFactors.some((value) => !Number.isSafeInteger(value) || value < 7 || value > 12)
    )
        throw new Error('Range Scan needs spreading factors from 7 to 12')
    if (![1, 2, 4, 8, 16].includes(cadSymbols)) throw new Error('Invalid CAD symbol count')
    if (!Number.isSafeInteger(rxTimeoutMs) || rxTimeoutMs < 1 || rxTimeoutMs > 22_000)
        throw new Error('RX timeout must be 1–22000 ms')
    const bandwidths = [...new Set(bandwidthsKHz)].join(',')
    const factors = [...new Set(spreadingFactors)].join(',')
    return `mode range ${startMHz.toFixed(6)} ${endMHz.toFixed(6)} ${bandwidths} ${factors} ${cadSymbols} ${rxTimeoutMs}`
}

export function locationCommand(latitude: number, longitude: number, altitudeM: number): string {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
        throw new Error('Invalid latitude')
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
        throw new Error('Invalid longitude')
    if (!Number.isSafeInteger(altitudeM) || altitudeM < -500 || altitudeM > 10_000)
        throw new Error('Invalid altitude')
    return `loc ${latitude.toFixed(7)} ${longitude.toFixed(7)} ${altitudeM}`
}

export function tleCommand(tle: {
    readonly norad: number
    readonly line1: string
    readonly line2: string
}): string {
    if (!Number.isSafeInteger(tle.norad) || tle.norad <= 0 || tle.norad > 99_999)
        throw new Error('Invalid NORAD id')
    if (
        !validTleLine(tle.line1, 1) ||
        !validTleLine(tle.line2, 2) ||
        Number(tle.line1.slice(2, 7)) !== tle.norad ||
        Number(tle.line2.slice(2, 7)) !== tle.norad
    )
        throw new Error('TLE lines do not match the NORAD id or checksum')
    return `tle ${tle.norad} ${tle.line1} ${tle.line2}`
}

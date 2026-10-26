import { describe, expect, it } from 'vitest'

import {
    fixedModeCommand,
    dopplerCommand,
    locationCommand,
    minimumElevationCommand,
    modeCommand,
    rangeModeCommand,
    rangeScanEstimate,
    tleCommand,
} from '@core/satellite/commands'

function checkedLine(number: 1 | 2, norad: string, epoch = ''): string {
    const chars = Array.from({ length: 68 }, () => ' ')
    chars[0] = String(number)
    chars[1] = ' '
    for (let index = 0; index < 5; index++) chars[index + 2] = norad[index] ?? '0'
    if (number === 1) {
        chars[7] = 'U'
        for (let index = 0; index < epoch.length; index++) chars[index + 18] = epoch[index] ?? ' '
    }
    const prefix = chars.join('')
    let checksum = 0
    for (let index = 0; index < prefix.length; index++) {
        const character = prefix.codePointAt(index) ?? 0
        if (character >= 48 && character <= 57) checksum += character - 48
        else if (character === 45) checksum++
    }
    return `${prefix}${String(checksum % 10)}`
}

describe('satellite station commands', () => {
    it('builds explicit mode, location, TLE, and Range Scan commands', () => {
        expect(modeCommand('auto')).toBe('mode auto')
        expect(minimumElevationCommand(10)).toBe('min_el 10')
        expect(dopplerCommand(true)).toBe('doppler on')
        expect(dopplerCommand(false)).toBe('doppler off')
        expect(fixedModeCommand('coconut')).toBe('mode fixed coconut')
        expect(locationCommand(37.5, -122.25, 10)).toBe('loc 37.5000000 -122.2500000 10')
        expect(
            rangeModeCommand({
                startMHz: 435,
                endMHz: 438,
                bandwidthsKHz: [62.5, 125],
                spreadingFactors: [7, 8, 9, 10, 11, 12],
                cadSymbols: 4,
                rxTimeoutMs: 22_000,
            })
        ).toBe('mode range 435.000000 438.000000 62.5,125 7,8,9,10,11,12 4 22000')
        expect(
            rangeScanEstimate({
                startMHz: 435,
                endMHz: 438,
                bandwidthsKHz: [62.5, 125],
                spreadingFactors: [7, 8, 9, 10, 11, 12],
                cadSymbols: 4,
                rxTimeoutMs: 22_000,
            }).combinations
        ).toBe(876)
        expect(
            tleCommand({
                norad: 25_544,
                line1: checkedLine(1, '25544', '26024.50000000'),
                line2: checkedLine(2, '25544'),
            })
        ).toMatch(/^tle 25544 1 /u)
    })

    it('rejects unsafe or malformed command arguments', () => {
        expect(() => fixedModeCommand('coconut\nmode auto')).toThrow()
        expect(() => locationCommand(91, 0, 0)).toThrow()
        expect(() => minimumElevationCommand(91)).toThrow()
        expect(() =>
            rangeModeCommand({
                startMHz: 434,
                endMHz: 438,
                bandwidthsKHz: [125],
                spreadingFactors: [7],
                cadSymbols: 4,
                rxTimeoutMs: 1500,
            })
        ).toThrow()
        expect(() =>
            tleCommand({ norad: 25_544, line1: '1 invalid', line2: '2 invalid' })
        ).toThrow()
    })
})

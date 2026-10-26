import { describe, expect, it } from 'vitest'

import { newestTles, parseTleCatalog, validTleLine } from '@core/satellite/tle'

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

describe('satellite TLE parsing', () => {
    it('validates 69-column checksums and parses named CelesTrak records', () => {
        const line1 = checkedLine(1, '25544', '26024.50000000')
        const line2 = checkedLine(2, '25544')
        expect(validTleLine(line1, 1)).toBe(true)
        expect(validTleLine(line2, 2)).toBe(true)
        expect(
            parseTleCatalog(`0 ISS (ZARYA)\n${line1}\n${line2}\n`, Date.UTC(2026, 0, 25))
        ).toEqual([
            {
                norad: 25_544,
                name: 'ISS (ZARYA)',
                line1,
                line2,
                epoch: Date.UTC(2026, 0, 24, 12) / 1000,
                ageDays: 0,
            },
        ])
    })

    it('skips invalid checksums and mismatched catalog lines', () => {
        const line1 = checkedLine(1, '25544', '26024.50000000')
        const badLine2 = `${checkedLine(2, '25544').slice(0, 68)}0`
        const otherLine2 = checkedLine(2, '25545')
        expect(parseTleCatalog(`ISS\n${line1}\n${badLine2}\nISS\n${line1}\n${otherLine2}`)).toEqual(
            []
        )
    })

    it('keeps the newest record per satellite', () => {
        const earlier = { norad: 42, epoch: 10, name: 'A', line1: '', line2: '', ageDays: 5 }
        const later = { ...earlier, epoch: 20, ageDays: 1 }
        expect(newestTles([later, earlier])).toEqual([later])
    })
})

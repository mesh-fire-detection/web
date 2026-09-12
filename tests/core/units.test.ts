import { describe, expect, it } from 'vitest'

import {
    DEFAULT_UNIT_SYSTEM,
    formatCopy,
    formatDistance,
    formatLength,
    parseUnitSystem,
    toFeet,
    toKm,
    toMeters,
    toMiles,
} from '@core/format/units'

describe('parseUnitSystem', () => {
    it('defaults to imperial', () => {
        expect(DEFAULT_UNIT_SYSTEM).toBe('imperial')
        expect(parseUnitSystem(null)).toBe('imperial')
        expect(parseUnitSystem(undefined)).toBe('imperial')
        expect(parseUnitSystem('nope')).toBe('imperial')
        expect(parseUnitSystem('imperial')).toBe('imperial')
    })

    it('accepts metric', () => {
        expect(parseUnitSystem('metric')).toBe('metric')
    })
})

describe('distance conversion', () => {
    it('converts kilometres to miles and back', () => {
        expect(toMiles(1.609344)).toBeCloseTo(1)
        expect(toKm(1)).toBeCloseTo(1.609344)
    })

    it('formats imperial distance from kilometres', () => {
        expect(formatDistance(3, 'imperial')).toBe('1.9 mi')
    })

    it('formats metric distance', () => {
        expect(formatDistance(3, 'metric')).toBe('3.0 km')
    })
})

describe('length conversion', () => {
    it('converts metres to feet and back', () => {
        expect(toFeet(0.3048)).toBeCloseTo(1)
        expect(toMeters(1)).toBeCloseTo(0.3048)
    })

    it('formats imperial length from metres', () => {
        expect(formatLength(8, 'imperial')).toBe('26 ft')
    })

    it('formats metric length', () => {
        expect(formatLength(8, 'metric')).toBe('8 m')
    })

    it('appends AGL and respects places', () => {
        expect(formatLength(8, 'metric', { agl: true })).toBe('8 m AGL')
        expect(formatLength(8, 'imperial', { agl: true })).toBe('26 ft AGL')
        expect(formatLength(8.7, 'metric', { places: 1 })).toBe('8.7 m')
    })
})

describe('formatCopy', () => {
    it('passes plain strings through', () => {
        expect(formatCopy('A node with its mast weighs roughly 2.5 kg.', 'imperial')).toBe(
            'A node with its mast weighs roughly 2.5 kg.'
        )
    })

    it('formats SI measures in copy for each unit system', () => {
        const copy = ['A Base node at ', { m: 8 }, ' beats ', { m: 2 }, '.'] as const

        expect(formatCopy(copy, 'imperial')).toBe('A Base node at 26 ft beats 7 ft.')
        expect(formatCopy(copy, 'metric')).toBe('A Base node at 8 m beats 2 m.')
    })

    it('formats distances and whole kilometres', () => {
        expect(formatCopy(['The ', { km: 2.5 }, ' hop'], 'imperial')).toBe('The 1.6 mi hop')
        expect(formatCopy(['The ', { km: 2.5 }, ' hop'], 'metric')).toBe('The 2.5 km hop')
        expect(formatCopy(['more than ', { km: 5, places: 0 }], 'imperial')).toBe('more than 3 mi')
        expect(formatCopy(['more than ', { km: 5, places: 0 }], 'metric')).toBe('more than 5 km')
    })
})

import { describe, expect, it } from 'vitest'

import { DEFAULT_LINK, computeLink, nodesForCorridor } from '@core/map/linkBudget'

describe('computeLink', () => {
    it('closes a short open hop on long-fast', () => {
        const result = computeLink({
            ...DEFAULT_LINK,
            distanceKm: 1,
            terrain: 'open',
            fadeMarginDb: 10,
        })

        expect(result.closes).toBe(true)
        expect(result.beyondHorizon).toBe(false)
        expect(result.marginDb).toBeGreaterThan(10)
    })

    it('fails a hop past the radio horizon', () => {
        const result = computeLink({
            ...DEFAULT_LINK,
            distanceKm: 80,
            txHeightM: 2,
            rxHeightM: 2,
            terrain: 'open',
        })

        expect(result.beyondHorizon).toBe(true)
        expect(result.closes).toBe(false)
        expect(result.verdict).toBe('no-link')
    })

    it('keeps maxRangeKm inside the radio horizon', () => {
        const result = computeLink({
            ...DEFAULT_LINK,
            distanceKm: 3,
            terrain: 'open',
            txHeightM: 8,
            rxHeightM: 8,
        })

        expect(result.maxRangeKm).toBeGreaterThan(0)
        expect(result.maxRangeKm).toBeLessThanOrEqual(result.radioHorizonKm)
    })

    it('grows fresnelRadiusM with distance', () => {
        const near = computeLink({ ...DEFAULT_LINK, distanceKm: 1 })
        const far = computeLink({ ...DEFAULT_LINK, distanceKm: 4 })

        expect(near.fresnelRadiusM).toBeGreaterThan(0)
        expect(far.fresnelRadiusM).toBeGreaterThan(near.fresnelRadiusM)
    })

    it('walks the verdict ladder as margin shrinks', () => {
        const strong = computeLink({
            ...DEFAULT_LINK,
            distanceKm: 0.5,
            terrain: 'open',
            fadeMarginDb: 10,
        })
        const workable = computeLink({
            ...DEFAULT_LINK,
            distanceKm: 5,
            terrain: 'built-up',
            fadeMarginDb: 10,
        })
        const marginal = computeLink({
            ...DEFAULT_LINK,
            distanceKm: 6,
            terrain: 'built-up',
            fadeMarginDb: 10,
        })
        const noLink = computeLink({
            ...DEFAULT_LINK,
            distanceKm: 40,
            terrain: 'dense-forest',
            fadeMarginDb: 10,
        })

        expect(strong.verdict).toBe('strong')
        expect(workable.verdict).toBe('workable')
        expect(marginal.verdict).toBe('marginal')
        expect(noLink.verdict).toBe('no-link')
    })

    it('loses margin as distance grows', () => {
        const near = computeLink({ ...DEFAULT_LINK, distanceKm: 1, terrain: 'open' })
        const far = computeLink({ ...DEFAULT_LINK, distanceKm: 5, terrain: 'open' })

        expect(far.marginDb).toBeLessThan(near.marginDb)
    })
})

describe('nodesForCorridor', () => {
    it('returns 0 when hop length is not positive', () => {
        expect(nodesForCorridor(10, 0)).toBe(0)
        expect(nodesForCorridor(10, -1)).toBe(0)
    })

    it('ceil-divides the corridor and adds the far end', () => {
        expect(nodesForCorridor(10, 5)).toBe(3)
        expect(nodesForCorridor(10, 3)).toBe(5)
        expect(nodesForCorridor(1, 10)).toBe(2)
    })
})

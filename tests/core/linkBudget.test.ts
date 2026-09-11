import { describe, expect, it } from 'vitest'

import { DEFAULT_LINK, computeLink } from '@core/map/linkBudget'

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
    })
})

import { describe, expect, it } from 'vitest'

import { averageRate, historyValue } from '@core/nearby/metrics'

const HOUR = 60 * 60 * 1000
const hourly = (values: readonly number[]) =>
    values.map((value, hour) => ({ value, at: hour * HOUR }))

describe('averageRate', () => {
    it('fits a line through every sample, so one noisy end does not swing it', () => {
        // Steady at −1 % an hour, then a noisy reading 5 % low. First to last
        // says −2.25 % an hour (−54 a day); the fitted line says −2 (−48 a day).
        const rate = averageRate('deviceMetrics.batteryLevel', hourly([90, 89, 88, 87, 81]))
        expect(rate?.perDay).toBeCloseTo(-48, 5)
        expect(rate?.spanMs).toBe(4 * HOUR)
    })

    it('estimates days left only for a falling battery', () => {
        const falling = averageRate('deviceMetrics.batteryLevel', hourly([50, 49, 48]))
        expect(falling?.daysLeft).toBeCloseTo(2, 5)
        const charging = averageRate('deviceMetrics.batteryLevel', hourly([48, 49, 50]))
        expect(charging?.daysLeft).toBeNull()
        const voltage = averageRate('deviceMetrics.voltage', hourly([4, 3.9, 3.8]))
        expect(voltage?.perDay).toBeCloseTo(-2.4, 5)
        expect(voltage?.daysLeft).toBeNull()
    })

    it('leaves out readings on external power, and waits for an hour and three samples', () => {
        const mixed = averageRate('deviceMetrics.batteryLevel', hourly([101, 101, 80, 79, 78]))
        expect(mixed?.perDay).toBeCloseTo(-24, 5)
        expect(averageRate('deviceMetrics.batteryLevel', hourly([101, 101, 101]))).toBeNull()
        expect(averageRate('deviceMetrics.voltage', hourly([4, 3.9]))).toBeNull()
        const quick = [0, 1, 2].map((minute) => ({ value: 4 - minute / 100, at: minute * 60_000 }))
        expect(averageRate('deviceMetrics.voltage', quick)).toBeNull()
    })
})

describe('historyValue', () => {
    it('names external power instead of showing 101 %', () => {
        expect(historyValue('deviceMetrics.batteryLevel', 101)).toBe('Powered')
        expect(historyValue('deviceMetrics.batteryLevel', 64)).toBe('64 %')
    })

    it('gives a voltage the charge it stands for, unless no battery is attached', () => {
        expect(historyValue('deviceMetrics.voltage', 3.72)).toBe('3.72 V (≈ 50 %)')
        expect(historyValue('deviceMetrics.voltage', 4.2)).toBe('4.2 V (≈ 100 %)')
        expect(historyValue('deviceMetrics.voltage', 0)).toBe('0 V')
        expect(historyValue('environmentMetrics.temperature', 21)).toBe('21 °C')
    })
})

describe('averageRate for voltage', () => {
    it('also gives the rate in estimated battery percent, with days left', () => {
        // 3.80 V (60 %) to 3.72 V (50 %) over a day: 10 % a day, 5 days left.
        const day = 24 * HOUR
        const samples = [3.8, 3.76, 3.72].map((value, index) => ({ value, at: (index * day) / 2 }))
        const rate = averageRate('deviceMetrics.voltage', samples)
        expect(rate?.perDay).toBeCloseTo(-0.08, 5)
        expect(rate?.percent?.perDay).toBeCloseTo(-10, 5)
        expect(rate?.percent?.daysLeft).toBeCloseTo(5, 5)
        expect(averageRate('deviceMetrics.batteryLevel', hourly([50, 49, 48]))?.percent).toBeNull()
    })
})

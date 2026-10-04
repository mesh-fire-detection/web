// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MetricHistoryStats } from '@components/pages/build/nearby/DeviceReadings'

afterEach(cleanup)

describe('observed history changes', () => {
    it('shows the actual change and interval instead of extrapolating to a full hour', () => {
        const start = Date.UTC(2026, 9, 3, 12)
        render(
            <MetricHistoryStats
                metric='environmentMetrics.temperature'
                history={{
                    source: 'browser',
                    samples: [
                        { value: 25, at: start },
                        { value: 23.7, at: start + 5 * 60_000 },
                        { value: 20.7, at: start + 65 * 60_000 },
                        { value: 21.2, at: start + 70 * 60_000 },
                    ],
                }}
            />
        )
        const falling = screen.getByText('Fastest observed fall').closest('.nearby_stats > div')
        const rising = screen.getByText('Fastest observed rise').closest('.nearby_stats > div')
        expect(falling).not.toBeNull()
        expect(rising).not.toBeNull()
        if (!falling || !rising) throw new Error('Missing change cells')
        expect(within(falling as HTMLElement).getByText('−1.3 °C')).toBeDefined()
        expect(within(falling as HTMLElement).getByText(/over 5 min/)).toBeDefined()
        expect(within(rising as HTMLElement).getByText('+0.5 °C')).toBeDefined()
        expect(within(rising as HTMLElement).getByText(/over 5 min/)).toBeDefined()
        expect(screen.queryByText(/°C\/h/)).toBeNull()
        expect(screen.queryByText(/15\.6/)).toBeNull()
    })

    it('leaves changes empty when there is no usable interval', () => {
        render(
            <MetricHistoryStats
                metric='environmentMetrics.temperature'
                history={{ source: 'browser', samples: [{ value: 25, at: 0 }] }}
            />
        )
        expect(screen.getAllByText('—')).toHaveLength(2)
        expect(screen.queryByText(/over \d+ min/)).toBeNull()
    })
})

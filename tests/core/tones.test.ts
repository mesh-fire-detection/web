import { describe, expect, it } from 'vitest'

import { toneSegments } from '@core/format/tones'

describe('toneSegments', () => {
    it('splits marked ranges and keeps the text around them', () => {
        const segments = toneSegments(
            '{good|0–9 good}, {fair|9.1–35.4 moderate}, {bad|above} (µg/m³).'
        )
        expect(segments.map(({ text, tone }) => [text, tone])).toEqual([
            ['0–9 good', 'good'],
            [', ', null],
            ['9.1–35.4 moderate', 'fair'],
            [', ', null],
            ['above', 'bad'],
            [' (µg/m³).', null],
        ])
    })

    it('leaves unmarked or malformed text as plain', () => {
        expect(toneSegments('Plain text')).toEqual([{ text: 'Plain text', tone: null, start: 0 }])
        expect(toneSegments('{loud|x}')).toEqual([{ text: '{loud|x}', tone: null, start: 0 }])
    })
})

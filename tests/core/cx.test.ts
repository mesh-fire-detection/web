import { describe, expect, it } from 'vitest'

import { cx } from '@core/format/cx'

describe('cx', () => {
    it('joins non-empty strings', () => {
        expect(cx('text', 'text_muted')).toBe('text text_muted')
    })

    it('drops false, null, undefined, and empty strings', () => {
        expect(cx('text', false, null, undefined, '', 'text_small')).toBe('text text_small')
    })

    it('returns an empty string when nothing remains', () => {
        expect(cx(false, null, undefined, '')).toBe('')
    })
})

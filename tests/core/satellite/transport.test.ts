import { describe, expect, it } from 'vitest'

import { createLineDecoder } from '@core/satellite/transport'

describe('satellite receiver line decoder', () => {
    it('joins lines split across chunks, including a split multi-byte character', () => {
        const lines: string[] = []
        const decode = createLineDecoder((line) => {
            lines.push(line)
        })
        const bytes = new TextEncoder().encode('{"a":1}\r\n# note µ\n\n{"b"')
        decode(bytes.slice(0, 5))
        decode(bytes.slice(5, 17))
        decode(bytes.slice(17))
        decode(new TextEncoder().encode(':2}\n'))
        expect(lines).toEqual(['{"a":1}', '# note µ', '{"b":2}'])
    })
})

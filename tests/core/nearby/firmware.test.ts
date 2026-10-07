import { describe, expect, it } from 'vitest'

import { firmwareUpdate, MFD_RELEASE } from '@core/nearby/firmware'

describe('firmwareUpdate', () => {
    it('recognises the current release', () => {
        expect(firmwareUpdate(`${MFD_RELEASE.version}.${MFD_RELEASE.commit}`)).toBe('current')
    })

    it('flags an older build of ours', () => {
        expect(firmwareUpdate(`2.7.25.${MFD_RELEASE.commit}`)).toBe('outdated')
    })

    it('flags stock Meshtastic firmware', () => {
        expect(firmwareUpdate('2.7.15.567b8ea')).toBe('other')
    })

    it('admits it does not know before the node reports', () => {
        expect(firmwareUpdate('')).toBe('unknown')
    })
})

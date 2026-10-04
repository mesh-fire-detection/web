import { describe, expect, it } from 'vitest'

import { APP_ROUTES, NAV_ROUTES, opensInNewTab } from '@core/config/routes'

describe('route table', () => {
    it('has unique ids and paths', () => {
        const ids = APP_ROUTES.map((route) => route.id)
        const paths = APP_ROUTES.map((route) => route.path)
        expect(new Set(ids).size).toBe(ids.length)
        expect(new Set(paths).size).toBe(paths.length)
    })

    it('derives NAV_ROUTES from the nav flag only', () => {
        expect(NAV_ROUTES.map((route) => route.id)).toEqual(
            APP_ROUTES.filter((route) => route.nav).map((route) => route.id)
        )
        expect(NAV_ROUTES.length).toBe(APP_ROUTES.filter((route) => route.nav).length)
    })

    it('opens the device connection page in a new tab, with or without a hash', () => {
        expect(opensInNewTab('/connect')).toBe(true)
        expect(opensInNewTab('/connect#devices')).toBe(true)
        expect(opensInNewTab('/build')).toBe(false)
        expect(opensInNewTab('/build#firmware')).toBe(false)
    })
})

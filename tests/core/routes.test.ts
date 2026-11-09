import { describe, expect, it } from 'vitest'

import { APP_ROUTES, navRoutes, opensInNewTab } from '@core/config/routes'

describe('route table', () => {
    it('has unique ids and paths', () => {
        const ids = APP_ROUTES.map((route) => route.id)
        const paths = APP_ROUTES.map((route) => route.path)
        expect(new Set(ids).size).toBe(ids.length)
        expect(new Set(paths).size).toBe(paths.length)
    })

    it('shows Map, Build and About to everyone, and Nodes only when signed in', () => {
        const ids = (signedIn: boolean) => navRoutes(signedIn).map((route) => route.id)
        expect(ids(false)).toEqual(['map', 'build', 'about'])
        expect(ids(true)).toEqual(['map', 'build', 'about', 'nodes'])
    })

    it('keeps Coverage and Open Problems out of the header (web#12)', () => {
        expect(navRoutes(true).map((route) => route.id)).not.toContain('coverage')
        expect(navRoutes(true).map((route) => route.id)).not.toContain('open_problems')
    })

    it('opens the node connection page in a new tab, with or without a hash', () => {
        expect(opensInNewTab('/connect')).toBe(true)
        expect(opensInNewTab('/connect#nodes')).toBe(true)
        expect(opensInNewTab('/build')).toBe(false)
        expect(opensInNewTab('/build#firmware')).toBe(false)
    })
})

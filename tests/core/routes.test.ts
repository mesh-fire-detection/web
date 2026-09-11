import { describe, expect, it } from 'vitest'

import {
    APP_ROUTES,
    HEADER_NAV,
    NAV_ROUTES,
    matchRoute,
    normalizePathname,
    routeLabel,
} from '@core/config/routes'

describe('normalizePathname', () => {
    it('leaves the root path alone', () => {
        expect(normalizePathname('/')).toBe('/')
    })

    it('strips a single trailing slash', () => {
        expect(normalizePathname('/about/')).toBe('/about')
    })

    it('strips repeated trailing slashes', () => {
        expect(normalizePathname('/open-problems///')).toBe('/open-problems')
    })

    it('collapses a path of only slashes to the root', () => {
        expect(normalizePathname('///')).toBe('/')
    })

    it('lowercases the path', () => {
        expect(normalizePathname('/About')).toBe('/about')
        expect(normalizePathname('/MAP/')).toBe('/map')
    })

    it('is idempotent', () => {
        for (const route of APP_ROUTES) {
            const once = normalizePathname(route.path)
            expect(normalizePathname(once)).toBe(once)
        }
    })
})

describe('matchRoute', () => {
    it('resolves every declared route by its own path', () => {
        for (const route of APP_ROUTES) {
            expect(matchRoute(route.path)).not.toBeNull()
            expect(matchRoute(route.path)?.id).toBe(route.id)
        }
    })

    it('matches regardless of a trailing slash', () => {
        expect(matchRoute('/about/')).not.toBeNull()
        expect(matchRoute('/about/')?.id).toBe('about')
    })

    it('returns null for unknown paths', () => {
        expect(matchRoute('/does-not-exist')).toBeNull()
        expect(matchRoute('/about/deeper')).toBeNull()
    })
})

describe('route table invariants', () => {
    it('has unique ids', () => {
        const ids = APP_ROUTES.map((route) => route.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('has unique paths', () => {
        const paths = APP_ROUTES.map((route) => route.path)
        expect(new Set(paths).size).toBe(paths.length)
    })

    it('stores paths in the normalized form matchRoute looks up', () => {
        for (const route of APP_ROUTES) {
            expect(route.path).toBe(normalizePathname(route.path))
        }
    })

    it('exposes exactly the nav-flagged routes in NAV_ROUTES', () => {
        expect(NAV_ROUTES.map((route) => route.id)).toEqual(
            APP_ROUTES.filter((route) => route.nav).map((route) => route.id)
        )
    })

    it('points every header nav entry at a real route', () => {
        for (const item of HEADER_NAV) {
            expect(matchRoute(item.path)).not.toBeNull()
        }
    })
})

describe('routeLabel', () => {
    it('returns the label for a known path', () => {
        expect(routeLabel('/map')).toBe('Map')
        expect(routeLabel('/open-problems')).toBe('Open Problems')
    })
})

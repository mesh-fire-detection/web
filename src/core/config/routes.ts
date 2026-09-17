/**
 * Single source of truth for the site map.
 *
 * Every other route type is derived from `APP_ROUTES`: the pathname union,
 * the id union, and the page map in `@components/app/AppEntry` all follow.
 * Header primary nav is `NAV_ROUTES` — never a hand-maintained duplicate.
 */

type RouteShape = {
    readonly id: string
    readonly path: `/${string}`
    readonly label: string
    readonly nav: boolean
}

export const APP_ROUTES = [
    { id: 'home', path: '/', label: 'Home', nav: false },
    { id: 'map', path: '/map', label: 'Map', nav: true },
    { id: 'build', path: '/build', label: 'Build', nav: true },
    { id: 'coverage', path: '/coverage', label: 'Coverage', nav: true },
    { id: 'open_problems', path: '/open-problems', label: 'Open Problems', nav: true },
    { id: 'about', path: '/about', label: 'About', nav: true },
    { id: 'privacy', path: '/privacy', label: 'Privacy', nav: false },
    { id: 'terms', path: '/terms', label: 'Terms', nav: false },
] as const satisfies readonly RouteShape[]

type RouteDefinition = (typeof APP_ROUTES)[number]
export type RouteId = RouteDefinition['id']

export const NAV_ROUTES = APP_ROUTES.filter((route) => route.nav)

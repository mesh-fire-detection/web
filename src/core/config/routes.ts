/**
 * Single source of truth for the site map.
 *
 * Every other route type is derived from `APP_ROUTES`: the pathname union,
 * the id union, and the page map in `@components/app/AppEntry` all follow.
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
] as const satisfies readonly RouteShape[]

export type RouteDefinition = (typeof APP_ROUTES)[number]
export type AppPathname = RouteDefinition['path']
export type RouteId = RouteDefinition['id']

type HeaderNavItem = {
    readonly path: AppPathname
    readonly label: string
}

export const HEADER_NAV = [
    { path: '/map', label: 'Map' },
    { path: '/build', label: 'Build' },
    { path: '/coverage', label: 'Coverage' },
    { path: '/open-problems', label: 'Open Problems' },
    { path: '/about', label: 'About' },
] as const satisfies readonly HeaderNavItem[]

const ROUTE_BY_PATH: ReadonlyMap<string, RouteDefinition> = new Map(
    APP_ROUTES.map((route) => [route.path, route])
)

/** Strips trailing slashes and lowercases so `/About/` and `/about` are the same route. */
export const normalizePathname = (pathname: string): string => {
    return (pathname.replace(/\/+$/, '') || '/').toLowerCase()
}

export const matchRoute = (pathname: string): RouteDefinition | null => {
    return ROUTE_BY_PATH.get(normalizePathname(pathname)) ?? null
}

/**
 * The assertion is the one thing TypeScript cannot derive: `Object.fromEntries`
 * always widens its keys to `string`. It is sound because `AppPathname` is
 * itself derived from `APP_ROUTES`.
 */
const ROUTE_LABELS = Object.fromEntries(
    APP_ROUTES.map((route) => [route.path, route.label])
) as Record<AppPathname, string>

export const routeLabel = (path: AppPathname): string => ROUTE_LABELS[path]

export const NAV_ROUTES = APP_ROUTES.filter((route) => route.nav)

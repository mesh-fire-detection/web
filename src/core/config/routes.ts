/**
 * Single source of truth for the site map.
 *
 * Every other route type is derived from `APP_ROUTES`: the pathname union,
 * the id union, and the page map in `@components/app/AppEntry` all follow.
 * Header primary nav is `navRoutes()` — never a hand-maintained duplicate.
 */

type RouteShape = {
    readonly id: string
    readonly path: `/${string}`
    readonly label: string
    /** In the header nav: always, never, or only for someone signed in. */
    readonly nav: boolean | 'signed_in'
    /** Holds a live node connection, so links open it beside the current page. */
    readonly newTab?: boolean
    /** Only useful to a signed-in person, so it stays out of the sitemap. */
    readonly unlisted?: boolean
}

export const APP_ROUTES = [
    { id: 'design', path: '/design', label: 'UI Kit', nav: false },
    { id: 'home', path: '/', label: 'Home', nav: false },
    { id: 'map', path: '/map', label: 'Map', nav: true },
    { id: 'build', path: '/build', label: 'Build', nav: true },
    { id: 'connect', path: '/connect', label: 'Connect a Node', nav: false, newTab: true },
    { id: 'firmware', path: '/firmware', label: 'Firmware', nav: false },
    {
        id: 'satellite',
        path: '/satellite',
        label: 'Satellite Receiver',
        nav: false,
        newTab: true,
    },
    // Reference pages: linked from the footer, not the header (web#12).
    { id: 'coverage', path: '/coverage', label: 'Coverage', nav: false },
    { id: 'gateways', path: '/gateways', label: 'How Data Gets In', nav: false },
    { id: 'open_problems', path: '/open-problems', label: 'Open Problems', nav: false },
    { id: 'about', path: '/about', label: 'About', nav: true },
    { id: 'blog', path: '/blog', label: 'Blog', nav: false },
    { id: 'blog_post', path: '/blog/:slug', label: 'Blog post', nav: false },
    { id: 'privacy', path: '/privacy', label: 'Privacy', nav: false },
    { id: 'terms', path: '/terms', label: 'Terms', nav: false },
    { id: 'sign_in', path: '/sign-in', label: 'Sign in', nav: false, unlisted: true },
    { id: 'join', path: '/join', label: 'Become a member', nav: false },
    {
        id: 'subscribe_confirm',
        path: '/subscribe/confirm',
        label: 'Confirm your updates',
        nav: false,
        unlisted: true,
    },
    { id: 'account', path: '/account', label: 'Account', nav: false, unlisted: true },
    { id: 'nodes', path: '/nodes', label: 'Nodes', nav: 'signed_in', unlisted: true },
    { id: 'node', path: '/nodes/:id', label: 'Node', nav: false, unlisted: true },
] as const satisfies readonly RouteShape[]

type RouteDefinition = (typeof APP_ROUTES)[number]
export type RouteId = RouteDefinition['id']

/** The header's links, in route-table order: members also get the pages behind the session (web#13). */
export function navRoutes(signedIn: boolean): readonly RouteDefinition[] {
    return APP_ROUTES.filter(
        (route) => route.nav === true || (signedIn && route.nav === 'signed_in')
    )
}

/** Whether an in-app link target is a route marked `newTab`; hash and query are ignored. */
export function opensInNewTab(to: string): boolean {
    const [path] = to.split(/[?#]/u, 1)
    return APP_ROUTES.some((route) => 'newTab' in route && route.path === path)
}

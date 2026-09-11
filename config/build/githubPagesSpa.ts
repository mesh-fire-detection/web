import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { APP_ROUTES } from '../../src/core/config/routes.ts'
import { SITE } from '../../src/core/config/site.ts'

const siteRoot = (): string => SITE.url.replace(/\/+$/, '')

/** Loc + lastmod entries derived from APP_ROUTES so the sitemap cannot drift. */
const sitemapXml = (): string => {
    const root = siteRoot()
    const today = new Date().toISOString().slice(0, 10)
    const urls = APP_ROUTES.map((route) => {
        const loc = route.path === '/' ? `${root}/` : `${root}${route.path}`
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
    }).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

const robotsTxt = (): string => `User-agent: *\nAllow: /\n\nSitemap: ${siteRoot()}/sitemap.xml\n`

/**
 * GitHub Pages has no SPA fallback. Copy the Vite shell to 404.html (unknown
 * URLs) and to `{route}/index.html` (HTTP 200 on refresh of known routes).
 */
export const writeGithubPagesSpaFiles = (dist: string): void => {
    const index = path.join(dist, 'index.html')
    copyFileSync(index, path.join(dist, '404.html'))

    for (const route of APP_ROUTES) {
        if (route.path === '/') continue
        const directory = path.join(dist, route.path.slice(1))
        mkdirSync(directory, { recursive: true })
        copyFileSync(index, path.join(directory, 'index.html'))
    }

    writeFileSync(path.join(dist, 'sitemap.xml'), sitemapXml())
    writeFileSync(path.join(dist, 'robots.txt'), robotsTxt())
}

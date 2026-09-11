import { copyFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { APP_ROUTES } from '../../src/core/config/routes.ts'
import { SITE } from '../../src/core/config/site.ts'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * GitHub Pages project sites live under /repo/. `actions/configure-pages`
 * exposes that as BASE_PATH (`/repo` or empty). Locally it stays `/`.
 * Absolute SEO URLs use `SITE.url` instead — never concatenate both.
 */
const pagesBase = (): string => {
    const fromEnv = process.env['BASE_PATH']
    if (!fromEnv) return '/'
    const trimmed = fromEnv.replace(/\/+$/, '')
    if (!trimmed || trimmed === '/') return '/'
    return `${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}/`
}

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

/** SPA fallback for Pages plus robots/sitemap from SITE.url + APP_ROUTES. */
const githubPagesSpaFallback = (): Plugin => ({
    name: 'github-pages-spa-fallback',
    apply: 'build',
    writeBundle() {
        const dist = path.join(rootDir, 'dist')
        const index = path.join(dist, 'index.html')
        copyFileSync(index, path.join(dist, '404.html'))
        writeFileSync(path.join(dist, 'sitemap.xml'), sitemapXml())
        writeFileSync(path.join(dist, 'robots.txt'), robotsTxt())
    },
})

export default defineConfig({
    root: path.join(rootDir, 'src'),
    publicDir: path.join(rootDir, 'public'),
    envDir: rootDir,
    base: pagesBase(),
    plugins: [react(), githubPagesSpaFallback()],
    resolve: {
        alias: {
            '@config': path.join(rootDir, 'config'),
            '@core': path.join(rootDir, 'src/core'),
            '@components': path.join(rootDir, 'src/components'),
            '@assets': path.join(rootDir, 'src/assets'),
        },
    },
    build: {
        outDir: path.join(rootDir, 'dist'),
        emptyOutDir: true,
        sourcemap: true,
    },
    server: {
        port: 5173,
        open: false,
    },
    optimizeDeps: {
        // MapLibre v6's worker fails during Vite's dependency pre-bundle.
        exclude: ['maplibre-gl'],
    },
})

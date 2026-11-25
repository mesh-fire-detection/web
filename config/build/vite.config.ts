import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { SITE } from '../../src/core/config/site.ts'

import { writeGithubPagesSpaFiles } from './githubPagesSpa.ts'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Blog posts live in a sibling repository rather than in this one. BLOG_DIR
 * overrides where that checkout sits; a missing directory simply yields no
 * posts, so this repo always builds on its own.
 */
const blogDir = path.resolve(rootDir, process.env['BLOG_DIR'] ?? '../blog')

/**
 * GitHub Pages project sites live under /repo/. `actions/configure-pages`
 * exposes that as BASE_PATH (`/repo` or empty). Locally it stays `/`.
 * Absolute SEO URLs use `SITE.url` instead — never concatenate both.
 */
const pagesBase = (): string => {
    const fromEnv = process.env['BASE_PATH']
    if (!fromEnv) return '/'
    const trimmed = fromEnv.replace(/\/+$/, '')
    return !trimmed || trimmed === '/'
        ? '/'
        : `${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}/`
}

/**
 * The release this build belongs to, from package.json (web#21). Only the
 * version is defined, so the rest of package.json stays out of the bundle.
 */
const packageVersion = (
    JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')) as { version: string }
).version

/** SPA shells for known routes plus 404/robots/sitemap. */
const githubPagesSpaFallback = (): Plugin => ({
    name: 'github-pages-spa-fallback',
    apply: 'build',
    writeBundle() {
        writeGithubPagesSpaFiles(path.join(rootDir, 'dist'))
    },
})

export default defineConfig({
    root: path.join(rootDir, 'src'),
    publicDir: path.join(rootDir, 'public'),
    envDir: rootDir,
    base: pagesBase(),
    define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageVersion) },
    plugins: [react(), githubPagesSpaFallback()],
    resolve: {
        alias: {
            '@config': path.join(rootDir, 'config'),
            '@core': path.join(rootDir, 'src/core'),
            '@components': path.join(rootDir, 'src/components'),
            '@assets': path.join(rootDir, 'src/assets'),
            '@blog': blogDir,
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
        // Post sources sit outside the Vite root, so dev has to be told.
        fs: { allow: [rootDir, blogDir] },
        proxy: {
            /**
             * The live API, reached from a local site. Its CORS and Better Auth
             * admit only `SITE.url`, so the browser calls this same-origin path
             * and the dev server forwards it as if from the real site. Opt in
             * with `npm run dev:live` (VITE_API_URL=/live-api). It is the
             * production backend: sign-ins send real email, writes are real.
             */
            '/live-api': {
                target: SITE.api,
                changeOrigin: true,
                secure: true,
                rewrite: (url) => url.replace(/^\/live-api/u, ''),
                headers: { origin: SITE.url },
            },
        },
    },
    optimizeDeps: {
        // MapLibre v6's worker fails during Vite's dependency pre-bundle.
        exclude: ['maplibre-gl'],
    },
})

import { copyFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

/**
 * GitHub Pages project sites live under /repo/. `actions/configure-pages`
 * exposes that as BASE_PATH (`/repo` or empty). Locally it stays `/`.
 */
function pagesBase(): string {
    const fromEnv = process.env['BASE_PATH']
    if (!fromEnv) return '/'
    const trimmed = fromEnv.replace(/\/+$/, '')
    if (!trimmed || trimmed === '/') return '/'
    return `${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}/`
}

/** GitHub Pages has no SPA fallback. Copy index.html so /map and /build resolve. */
function githubPagesSpaFallback(): Plugin {
    return {
        name: 'github-pages-spa-fallback',
        apply: 'build',
        writeBundle() {
            const index = path.join(projectRoot, 'dist', 'index.html')
            copyFileSync(index, path.join(projectRoot, 'dist', '404.html'))
        },
    }
}

export default defineConfig({
    // The config lives in config/, the project it builds does not.
    root: projectRoot,
    base: pagesBase(),
    plugins: [react(), githubPagesSpaFallback()],
    resolve: {
        alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
    },
    build: {
        outDir: 'dist',
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

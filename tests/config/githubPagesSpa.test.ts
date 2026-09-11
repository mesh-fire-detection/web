import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { writeGithubPagesSpaFiles } from '@config/build/githubPagesSpa'
import { APP_ROUTES } from '@core/config/routes'

const SHELL = '<!doctype html><title>shell</title>\n'

const nestedRoutePaths = APP_ROUTES.map((route) => route.path).filter(
    (routePath) => routePath !== '/'
)

let dist: string

beforeEach(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'mfd-pages-spa-'))
    fs.writeFileSync(path.join(dist, 'index.html'), SHELL)
})

afterEach(() => {
    fs.rmSync(dist, { recursive: true, force: true })
})

describe('writeGithubPagesSpaFiles', () => {
    it('copies the Vite shell to 404.html and each public route', () => {
        writeGithubPagesSpaFiles(dist)

        expect(fs.readFileSync(path.join(dist, '404.html'), 'utf8')).toBe(SHELL)
        expect(nestedRoutePaths.length).toBeGreaterThan(0)

        for (const routePath of nestedRoutePaths) {
            const nested = path.join(dist, routePath.slice(1), 'index.html')
            expect(fs.readFileSync(nested, 'utf8')).toBe(SHELL)
        }
    })

    it('does not nest a folder for the home route', () => {
        writeGithubPagesSpaFiles(dist)

        expect(fs.readFileSync(path.join(dist, 'index.html'), 'utf8')).toBe(SHELL)
        expect(fs.existsSync(path.join(dist, 'index', 'index.html'))).toBe(false)
    })

    it('still writes sitemap and robots next to the shells', () => {
        writeGithubPagesSpaFiles(dist)

        expect(fs.existsSync(path.join(dist, 'sitemap.xml'))).toBe(true)
        expect(fs.existsSync(path.join(dist, 'robots.txt'))).toBe(true)
    })
})

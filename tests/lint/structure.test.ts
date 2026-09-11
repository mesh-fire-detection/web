import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildReport, countBlocking, countWarnings } from '@config/lint/structure/report'
import {
    CSS_FILENAME_PATTERN,
    collectCssFilenameViolations,
    collectFileLengthViolations,
    collectFolderChecks,
    getLevel,
    parseArgs,
    type StructureRule,
} from '@config/lint/structure/rules'

const RULE: StructureRule = {
    label: 'Test root',
    target: 'src',
    minEntries: 2,
    warnEntries: 3,
    errorEntries: 5,
    warnFileLines: 5,
    errorFileLines: 10,
}

const NO_EXCLUDES = new Set<string>()

let rootDir: string

beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mfd-structure-'))
})

afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true })
})

const write = (relativePath: string, contents = 'x') => {
    const absolute = path.join(rootDir, relativePath)
    fs.mkdirSync(path.dirname(absolute), { recursive: true })
    fs.writeFileSync(absolute, contents)
}

const lines = (count: number) => Array.from({ length: count }, () => 'const a = 1').join('\n')

describe('getLevel', () => {
    it('returns null inside the limits', () => {
        expect(getLevel(3, 5, 10)).toBeNull()
    })

    it('treats the warn threshold as an exclusive bound', () => {
        expect(getLevel(5, 5, 10)).toBeNull()
        expect(getLevel(6, 5, 10)).toBe('warn')
    })

    it('treats the error threshold as an exclusive bound', () => {
        expect(getLevel(10, 5, 10)).toBe('warn')
        expect(getLevel(11, 5, 10)).toBe('error')
    })
})

describe('parseArgs', () => {
    it('defaults to report-only with no excludes', () => {
        const options = parseArgs([])

        expect(options.strict).toBe(false)
        expect(options.showAll).toBe(false)
        expect(options.excludes.size).toBe(0)
    })

    it('reads the flags', () => {
        const options = parseArgs(['--strict', '--show-all'])

        expect(options.strict).toBe(true)
        expect(options.showAll).toBe(true)
    })

    it('reads both --exclude forms', () => {
        const options = parseArgs(['--exclude', 'vendor', '--exclude=generated'])

        expect([...options.excludes].toSorted((a, b) => a.localeCompare(b))).toEqual([
            'generated',
            'vendor',
        ])
    })

    it('does not swallow the next flag as an --exclude value', () => {
        const options = parseArgs(['--exclude', '--strict'])

        expect(options.excludes.size).toBe(0)
        expect(options.strict).toBe(true)
    })

    it('ignores unknown arguments', () => {
        expect(parseArgs(['--nope']).strict).toBe(false)
    })
})

describe('collectFolderChecks', () => {
    it('flags a folder holding fewer than minEntries as an error', () => {
        write('src/only.ts')

        const checks = collectFolderChecks(rootDir, path.join(rootDir, 'src'), RULE, NO_EXCLUDES)

        expect(checks).toEqual([{ relativePath: 'src', entriesCount: 1, level: 'error' }])
    })

    it('passes a folder inside the limits', () => {
        write('src/a.ts')
        write('src/b.ts')

        const checks = collectFolderChecks(rootDir, path.join(rootDir, 'src'), RULE, NO_EXCLUDES)

        expect(checks[0]?.level).toBeNull()
    })

    it('warns past warnEntries and errors past errorEntries', () => {
        for (const name of ['a', 'b', 'c', 'd']) write(`src/${name}.ts`)
        for (const name of ['a', 'b', 'c', 'd', 'e', 'f']) write(`src/deep/${name}.ts`)

        const checks = collectFolderChecks(rootDir, path.join(rootDir, 'src'), RULE, NO_EXCLUDES)
        const byPath = new Map(checks.map((check) => [check.relativePath, check.level]))

        expect(byPath.get('src')).toBe('warn')
        expect(byPath.get(path.join('src', 'deep'))).toBe('error')
    })

    it('descends into subfolders', () => {
        write('src/a.ts')
        write('src/b.ts')
        write('src/nested/c.ts')
        write('src/nested/d.ts')

        const checks = collectFolderChecks(rootDir, path.join(rootDir, 'src'), RULE, NO_EXCLUDES)

        expect(checks.map((check) => check.relativePath)).toEqual([
            'src',
            path.join('src', 'nested'),
        ])
    })

    it('skips excluded directories and does not count them as entries', () => {
        write('src/a.ts')
        write('src/b.ts')
        write('src/node_modules/junk.ts')

        const checks = collectFolderChecks(
            rootDir,
            path.join(rootDir, 'src'),
            RULE,
            new Set(['node_modules'])
        )

        expect(checks).toHaveLength(1)
        expect(checks[0]?.entriesCount).toBe(2)
    })
})

describe('collectFileLengthViolations', () => {
    it('reports files past the warn and error line limits', () => {
        write('src/short.ts', lines(3))
        write('src/medium.ts', lines(7))
        write('src/long.ts', lines(20))

        const violations = collectFileLengthViolations(
            rootDir,
            path.join(rootDir, 'src'),
            RULE,
            NO_EXCLUDES
        )

        expect(violations.map((violation) => [violation.relativePath, violation.level])).toEqual([
            [path.join('src', 'long.ts'), 'error'],
            [path.join('src', 'medium.ts'), 'warn'],
        ])
    })

    it('only counts .ts and .tsx files', () => {
        write('src/huge.md', lines(50))
        write('src/huge.css', lines(50))

        const violations = collectFileLengthViolations(
            rootDir,
            path.join(rootDir, 'src'),
            RULE,
            NO_EXCLUDES
        )

        expect(violations).toEqual([])
    })
})

describe('css filenames', () => {
    it.each(['app_shell.css', 'reading_column.css', 'tokens.css', 'grid_2_col.css'])(
        'accepts %s',
        (name) => {
            expect(CSS_FILENAME_PATTERN.test(name)).toBe(true)
        }
    )

    it.each(['AppShell.css', 'reading-column.css', 'app__shell.css', '_leading.css'])(
        'rejects %s',
        (name) => {
            expect(CSS_FILENAME_PATTERN.test(name)).toBe(false)
        }
    )

    it('reports the offending files', () => {
        write('src/ok_name.css')
        write('src/BadName.css')

        const violations = collectCssFilenameViolations(
            rootDir,
            path.join(rootDir, 'src'),
            NO_EXCLUDES
        )

        expect(violations.map((violation) => violation.fileName)).toEqual(['BadName.css'])
    })
})

describe('buildReport', () => {
    const options = { strict: true, showAll: false, excludes: NO_EXCLUDES }

    it('records a missing target instead of throwing', () => {
        const report = buildReport(rootDir, [RULE], options)

        expect(report.missingTargets).toHaveLength(1)
        expect(countBlocking(report)).toBe(1)
    })

    it('reports a clean tree as having nothing blocking', () => {
        write('src/a.ts')
        write('src/b.ts')

        const report = buildReport(rootDir, [RULE], options)

        expect(countBlocking(report)).toBe(0)
        expect(countWarnings(report)).toBe(0)
    })

    it('separates warnings from blocking errors', () => {
        for (const name of ['a', 'b', 'c', 'd']) write(`src/${name}.ts`)
        write('src/e.ts', lines(20))

        const report = buildReport(rootDir, [RULE], options)

        expect(countWarnings(report)).toBe(1)
        expect(countBlocking(report)).toBe(1)
    })
})

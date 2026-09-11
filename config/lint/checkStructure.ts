import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { buildReport, countBlocking, countWarnings } from './structure/report'
import {
    DEFAULT_EXCLUDED_DIRS,
    RULES,
    parseArgs as parseArguments,
    type StructureRule,
} from './structure/rules'

const ANSI_RED = '\u{1B}[31m'
const ANSI_YELLOW = '\u{1B}[33m'
const ANSI_RESET = '\u{1B}[0m'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const formatLevel = (level: 'error' | 'warn'): string =>
    level === 'error' ? `${ANSI_RED}[ERROR]${ANSI_RESET}` : `${ANSI_YELLOW}[WARN]${ANSI_RESET}`

const run = (argv: readonly string[], rules: readonly StructureRule[]): number => {
    const parsed = parseArguments(argv)
    const excludes = new Set([...DEFAULT_EXCLUDED_DIRS, ...parsed.excludes])
    const options = { ...parsed, excludes }

    console.log('[structure] Checking folder structure limits...')
    console.log(`[structure] Root: ${ROOT_DIR}`)
    console.log(`[structure] Mode: ${options.strict ? 'strict' : 'report-only'}`)
    console.log(
        `[structure] Ignored directories: ${[...excludes].toSorted((left, right) => left.localeCompare(right)).join(', ')}`
    )
    console.log('')

    const report = buildReport(ROOT_DIR, rules, options)

    if (options.showAll) {
        for (const check of report.checks) {
            const tag = check.level === null ? '[OK]' : formatLevel(check.level)
            console.log(`${tag} ${check.relativePath}: ${check.entriesCount}`)
        }
        console.log('')
    }

    for (const violation of report.folderViolations) {
        console.error(
            `${formatLevel(violation.level)} ${violation.relativePath}: ${violation.entriesCount} entries`
        )
    }

    for (const violation of report.fileLengthViolations) {
        console.error(
            `${formatLevel(violation.level)} ${violation.relativePath}: ${violation.lineCount} lines`
        )
    }

    for (const violation of report.cssViolations) {
        console.error(
            `${formatLevel('error')} ${violation.relativePath}: css filename must be snake_case`
        )
    }

    for (const name of report.classNames.undefinedInCss) {
        console.error(
            `${formatLevel('error')} class "${name}" is used in TSX but not defined in CSS`
        )
    }

    for (const name of report.classNames.unusedInSource) {
        console.error(`${formatLevel('error')} class "${name}" is defined in CSS but never used`)
    }

    for (const missing of report.missingTargets) {
        console.error(`${formatLevel('error')} ${missing}`)
    }

    const warnings = countWarnings(report)
    if (warnings > 0) {
        console.warn(`\n[structure] ${warnings} warning(s) found.`)
    }

    // A bad CSS filename always fails: unlike the thresholds it is never advisory.
    if (report.cssViolations.length > 0) {
        console.error('\n[structure] CSS filename check failed.')
        return 1
    }

    const blocking = countBlocking(report)
    if (blocking > 0) {
        if (!options.strict) {
            console.log('\n[structure] Report-only mode: use --strict to fail on this.')
            return 0
        }
        console.error(`\n[structure] Check failed: ${blocking} blocking problem(s).`)
        return 1
    }

    console.log('[structure] All checks passed.')
    return 0
}

process.exit(run(process.argv.slice(2), RULES))

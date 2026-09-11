import fs from 'node:fs'
import path from 'node:path'

type Severity = 'error' | 'warn'

export type StructureRule = {
    readonly label: string
    readonly target: string
    readonly minEntries: number
    readonly warnEntries: number
    readonly errorEntries: number
    readonly warnFileLines: number
    readonly errorFileLines: number
}

export type FolderCheck = {
    readonly relativePath: string
    readonly entriesCount: number
    readonly level: Severity | null
}

export type FolderViolation = FolderCheck & { readonly level: Severity }

export type FileLengthViolation = {
    readonly relativePath: string
    readonly lineCount: number
    readonly level: Severity
}

export type CssNameViolation = {
    readonly relativePath: string
    readonly fileName: string
}

export const DEFAULT_EXCLUDED_DIRS: readonly string[] = [
    '.git',
    '.next',
    '.turbo',
    '.yarn',
    '.cache',
    'coverage',
    'dist',
    'node_modules',
    'tmp',
]

export const RULES: readonly StructureRule[] = [
    {
        label: 'Client source root',
        target: 'src',
        minEntries: 2,
        warnEntries: 7,
        errorEntries: 10,
        warnFileLines: 500,
        errorFileLines: 1000,
    },
    // A config directory legitimately holds a single file.
    {
        label: 'Configuration root',
        target: 'config',
        minEntries: 1,
        warnEntries: 8,
        errorEntries: 12,
        warnFileLines: 500,
        errorFileLines: 1000,
    },
]

export type CliOptions = {
    readonly strict: boolean
    readonly showAll: boolean
    readonly excludes: ReadonlySet<string>
}

export const parseArgs = (argv: readonly string[]): CliOptions => {
    let isStrict = false
    let isShowAll = false
    const excludes = new Set<string>()

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index]

        if (argument === '--strict') {
            isStrict = true
            continue
        }

        if (argument === '--show-all') {
            isShowAll = true
            continue
        }

        if (argument === '--exclude') {
            const value = argv[index + 1]
            if (value !== undefined && value.length > 0 && !value.startsWith('--')) {
                excludes.add(value)
                index += 1
            }
            continue
        }

        if (argument?.startsWith('--exclude=') === true) {
            const value = argument.slice('--exclude='.length)
            if (value.length > 0) {
                excludes.add(value)
            }
        }
    }

    return { strict: isStrict, showAll: isShowAll, excludes }
}

/** `null` means "within limits"; thresholds are exclusive upper bounds. */
const getLevel = (
    value: number,
    warnThreshold: number,
    errorThreshold: number
): Severity | null => {
    if (value > errorThreshold) return 'error'
    if (value > warnThreshold) return 'warn'
    return null
}

const walkDirectories = function* (
    rootDir: string,
    excluded: ReadonlySet<string>
): Generator<{ readonly dir: string; readonly entries: readonly fs.Dirent[] }> {
    const stack = [rootDir]

    while (stack.length > 0) {
        const currentPath = stack.pop()
        if (currentPath === undefined) break

        const entries = fs.readdirSync(currentPath, { withFileTypes: true })
        yield { dir: currentPath, entries }

        for (const entry of entries) {
            if (!excluded.has(entry.name) && entry.isDirectory()) {
                stack.push(path.join(currentPath, entry.name))
            }
        }
    }
}

export const collectFolderChecks = (
    rootDir: string,
    targetDir: string,
    rule: StructureRule,
    excluded: ReadonlySet<string>
): readonly FolderCheck[] => {
    const checks: FolderCheck[] = []

    for (const { dir, entries } of walkDirectories(targetDir, excluded)) {
        const entriesCount = entries.filter(
            (entry) => !excluded.has(entry.name) && (entry.isDirectory() || entry.isFile())
        ).length

        const level =
            entriesCount < rule.minEntries
                ? 'error'
                : getLevel(entriesCount, rule.warnEntries, rule.errorEntries)

        checks.push({ relativePath: toRelative(rootDir, dir), entriesCount, level })
    }

    return checks.toSorted((left, right) => left.relativePath.localeCompare(right.relativePath))
}

export const toViolations = (checks: readonly FolderCheck[]): readonly FolderViolation[] =>
    checks.filter((check): check is FolderViolation => check.level !== null)

const FILE_LINE_COUNT_EXTENSIONS = new Set(['.ts', '.tsx'])

export const collectFileLengthViolations = (
    rootDir: string,
    targetDir: string,
    rule: StructureRule,
    excluded: ReadonlySet<string>
): readonly FileLengthViolation[] => {
    const violations = [...walkDirectories(targetDir, excluded)].flatMap(({ dir, entries }) =>
        entries
            .filter(
                (entry) =>
                    !excluded.has(entry.name) &&
                    entry.isFile() &&
                    FILE_LINE_COUNT_EXTENSIONS.has(path.extname(entry.name))
            )
            .map((entry) => {
                const absoluteFilePath = path.join(dir, entry.name)
                const lineCount = fs.readFileSync(absoluteFilePath, 'utf8').split('\n').length

                return {
                    relativePath: toRelative(rootDir, absoluteFilePath),
                    lineCount,
                    level: getLevel(lineCount, rule.warnFileLines, rule.errorFileLines),
                }
            })
            .filter((candidate): candidate is FileLengthViolation => candidate.level !== null)
    )

    return violations.toSorted((left, right) => right.lineCount - left.lineCount)
}

const CSS_FILENAME_PATTERN = /^[a-z0-9]+(_[a-z0-9]+)*\.css$/

export const collectCssFilenameViolations = (
    rootDir: string,
    targetDir: string,
    excluded: ReadonlySet<string>
): readonly CssNameViolation[] => {
    const violations = [...walkDirectories(targetDir, excluded)].flatMap(({ dir, entries }) =>
        entries
            .filter(
                (entry) =>
                    !excluded.has(entry.name) &&
                    entry.isFile() &&
                    entry.name.endsWith('.css') &&
                    !CSS_FILENAME_PATTERN.test(entry.name)
            )
            .map((entry) => ({
                relativePath: toRelative(rootDir, path.join(dir, entry.name)),
                fileName: entry.name,
            }))
    )

    return violations.toSorted((left, right) => left.relativePath.localeCompare(right.relativePath))
}

const toRelative = (rootDir: string, absolutePath: string): string =>
    path.relative(rootDir, absolutePath) || '.'

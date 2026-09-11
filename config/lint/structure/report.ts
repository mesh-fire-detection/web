import fs from 'node:fs'
import path from 'node:path'

import { collectClassNameReport, type ClassNameReport } from './classNames'
import {
    collectCssFilenameViolations,
    collectFileLengthViolations,
    collectFolderChecks,
    toViolations,
    type CliOptions,
    type CssNameViolation,
    type FileLengthViolation,
    type FolderCheck,
    type FolderViolation,
    type StructureRule,
} from './rules'

export type StructureReport = {
    readonly checks: readonly FolderCheck[]
    readonly folderViolations: readonly FolderViolation[]
    readonly fileLengthViolations: readonly FileLengthViolation[]
    readonly cssViolations: readonly CssNameViolation[]
    readonly classNames: ClassNameReport
    readonly missingTargets: readonly string[]
}

export const buildReport = (
    rootDir: string,
    rules: readonly StructureRule[],
    options: CliOptions
): StructureReport => {
    const checks: FolderCheck[] = []
    const folderViolations: FolderViolation[] = []
    const fileLengthViolations: FileLengthViolation[] = []
    const cssViolations: CssNameViolation[] = []
    const missingTargets: string[] = []

    for (const rule of rules) {
        const targetDir = path.resolve(rootDir, rule.target)

        if (!fs.existsSync(targetDir)) {
            missingTargets.push(`${rule.label} (${rule.target}) does not exist.`)
            continue
        }

        const ruleChecks = collectFolderChecks(rootDir, targetDir, rule, options.excludes)
        checks.push(...ruleChecks)
        folderViolations.push(...toViolations(ruleChecks))
        fileLengthViolations.push(
            ...collectFileLengthViolations(rootDir, targetDir, rule, options.excludes)
        )
        cssViolations.push(...collectCssFilenameViolations(rootDir, targetDir, options.excludes))
    }

    return {
        checks,
        folderViolations,
        fileLengthViolations,
        cssViolations,
        classNames: collectClassNameReport(rootDir),
        missingTargets,
    }
}

/** Non-zero means the run should fail in strict mode. */
export const countBlocking = (report: StructureReport): number =>
    report.missingTargets.length +
    report.classNames.undefinedInCss.length +
    report.classNames.unusedInSource.length +
    report.folderViolations.filter((violation) => violation.level === 'error').length +
    report.fileLengthViolations.filter((violation) => violation.level === 'error').length

export const countWarnings = (report: StructureReport): number =>
    report.folderViolations.filter((violation) => violation.level === 'warn').length +
    report.fileLengthViolations.filter((violation) => violation.level === 'warn').length

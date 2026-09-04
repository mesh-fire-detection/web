#!/usr/bin/env node
/**
 * Project structure rules. Run by `npm run lint` and `npm run build`.
 *
 * These are directory-level rules, which is why they live here and not in
 * ESLint — ESLint reasons about one file's AST at a time and has no natural
 * way to express "this folder has too many things in it".
 */
import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

const CONFIG = {
  /** Directories to walk. The project root is exempt — npm and tooling own it. */
  roots: ['src', 'scripts', 'config'],
  /** Maximum source files in a single directory. Subdirectories do not count. */
  maxFilesPerDir: 7,
  /** Stylesheets live in exactly one place, never beside a component. */
  styleDir: join('src', 'styles'),
  styleExtensions: ['.css', '.scss', '.sass', '.less'],
  ignore: ['node_modules', 'dist', '.git', '.idea'],
}

const problems = []

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (CONFIG.ignore.includes(entry.name) || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (statSync(full).isFile()) files.push(entry.name)
  }

  const here = relative(ROOT, dir)

  if (files.length > CONFIG.maxFilesPerDir) {
    problems.push(
      `${here}${sep} holds ${files.length} files (limit ${CONFIG.maxFilesPerDir}).\n` +
        `    Split it into subdirectories: ${files.sort().join(', ')}`,
    )
  }

  const styles = files.filter((name) =>
    CONFIG.styleExtensions.some((ext) => name.endsWith(ext)),
  )
  if (styles.length > 0 && here !== CONFIG.styleDir) {
    problems.push(
      `${here}${sep} mixes stylesheets with source files: ${styles.join(', ')}.\n` +
        `    Move them to ${CONFIG.styleDir}${sep} and import from src/main.tsx.`,
    )
  }
}

for (const root of CONFIG.roots) {
  try {
    walk(join(ROOT, root))
  } catch {
    // A configured root that does not exist yet is not an error.
  }
}

if (problems.length > 0) {
  console.error(`\n  ${problems.length} structure problem(s):\n`)
  for (const problem of problems) console.error(`  ✗ ${problem}\n`)
  process.exit(1)
}

console.log(
  `  ✓ structure ok — no directory over ${CONFIG.maxFilesPerDir} files, ` +
    `no stylesheets outside ${CONFIG.styleDir}${sep}`,
)

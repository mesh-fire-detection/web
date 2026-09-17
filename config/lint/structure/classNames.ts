import fs from 'node:fs'
import path from 'node:path'

/**
 * Stylelint only sees CSS and ESLint only sees TSX, so nothing checks that a
 * class named in `className` actually exists — a typo just renders unstyled.
 *
 * Class names built from template literals (`spacer_${size}`) cannot be
 * resolved statically. Their stems are declared here, and any CSS class or
 * `className` fragment starting with one is left alone.
 */
const DYNAMIC_CLASS_STEMS: readonly string[] = [
    'gap_',
    'p_',
    'txt_',
    'hd_',
    'act_',
    'ai_',
    'jc_',
    'grid_',
    'spacer_',
    'tone_',
    'w_',
    'r_',
    'box_',
    'badge_',
    'dot_',
    'metric_',
    'divider_',
    'container_',
    'section_',
    'align_',
    'list_',
    'dlist_',
    'tlink_',
    'profile_los_',
    'profile_node_',
    'cost_col_',
]

export type ClassNameReport = {
    readonly undefinedInCss: readonly string[]
    readonly unusedInSource: readonly string[]
}

const isDynamic = (className: string): boolean =>
    DYNAMIC_CLASS_STEMS.some((stem) => className.startsWith(stem))

const readFilesDeep = (dir: string, extensions: ReadonlySet<string>): readonly string[] => {
    return fs.existsSync(dir)
        ? fs
              .readdirSync(dir, { withFileTypes: true, recursive: true })
              .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name)))
              .map((entry) => path.join(entry.parentPath, entry.name))
        : []
}

const CLASS_SELECTOR = /\.(-?[_a-z][\w-]*)/gi
const COMMENT = /\/\*[\S\s]*?\*\//g
const AT_RULE_PRELUDE = /@[\w-]+[^;{]*[;{]/g

const collectCssClasses = (stylesDir: string): ReadonlySet<string> => {
    const classes = new Set<string>()

    const files = readFilesDeep(stylesDir, new Set(['.css']))

    for (const file of files) {
        // `@import url('./base/index.css')` would otherwise read as a `.css` class.
        const source = fs
            .readFileSync(file, 'utf8')
            .replaceAll(COMMENT, '')
            .replaceAll(AT_RULE_PRELUDE, (match) => (match.endsWith('{') ? '{' : ''))

        // Only look at selector text, i.e. everything before a declaration block.
        for (const block of source.split('{')) {
            const selector = block.split('}').at(-1) ?? ''
            for (const match of selector.matchAll(CLASS_SELECTOR)) {
                const name = match[1]
                if (name !== undefined) classes.add(name)
            }
        }
    }

    return classes
}

const CLASS_NAME_ATTRIBUTE = /className=(?:'([^']*)'|"([^"]*)"|\{`([^`]*)`\})/g
const STRING_LITERAL = /'([^'\n]*)'/g
const CX_CALL = /\bcx\s*\(/g
const CX_STRING_LITERAL = /'([^'\n]*)'|"([^"\n]*)"|`([^`$\n]*)`/g

const QUOTES = new Set(["'", '"', '`'])

const addClassTokens = (classes: Set<string>, value: string): void => {
    // Parse artifacts from `cx('a', flag && \`b_${x}\`)` can look like
    // `, size && `. Real class lists never contain those tokens.
    if (value.includes('&&') || value.includes(',')) return

    for (const name of value.split(/\s+/)) {
        if (name !== '' && !name.includes('$')) classes.add(name)
    }
}

/** Advance past a string literal that starts at `index` (the opening quote). */
const skipStringLiteral = (source: string, index: number): number => {
    const quote = source[index]
    let cursor = index + 1

    while (cursor < source.length) {
        const inner = source[cursor]
        if (inner === '\\') {
            cursor += 2
            continue
        }
        if (inner === quote) return cursor + 1
        cursor += 1
    }

    return cursor
}

/** Balance brackets starting after the opening one, honouring string literals. */
const extractBalanced = (
    source: string,
    openIndex: number,
    open: string,
    close: string
): string | null => {
    let depth = 1
    let index = openIndex + 1

    while (index < source.length && depth > 0) {
        const char = source[index]

        if (char !== undefined && QUOTES.has(char)) {
            index = skipStringLiteral(source, index)
            continue
        }

        if (char === open) depth += 1
        else if (char === close) depth -= 1
        index += 1
    }

    return depth === 0 ? source.slice(openIndex + 1, index - 1) : null
}

const isComparisonOperand = (body: string, literalIndex: number): boolean => {
    const before = body.slice(0, literalIndex).trimEnd()
    return /(?:===|!==|==|!=)$/.test(before)
}

const collectLiteralsFromCxBody = (body: string, classes: Set<string>): void => {
    for (const literal of body.matchAll(CX_STRING_LITERAL)) {
        // Skip comparison operands: `variant === 'static' && 'corner_icon_static'`.
        if (isComparisonOperand(body, literal.index)) continue

        const value = literal[1] ?? literal[2] ?? literal[3] ?? ''
        addClassTokens(classes, value)
    }
}

const collectCxClasses = (source: string, classes: Set<string>): void => {
    for (const match of source.matchAll(CX_CALL)) {
        const openIndex = match.index + match[0].length - 1
        const body = extractBalanced(source, openIndex, '(', ')')
        if (body === null) continue

        collectLiteralsFromCxBody(body, classes)
    }
}

/**
 * A class held in a lookup table rather than written at the call site —
 * `VARIANT_CLASS` and `ACTIVE_CLASS` in NavHit and ExternalLink. Without this
 * the names reachable only through such a record were checked in one direction
 * only: renaming one showed up as "defined in CSS but never used", while adding
 * a new variant whose class was never written to CSS passed silently.
 *
 * The convention is the constant's name: SCREAMING_SNAKE containing `CLASS`.
 * Keys are identifiers, so every string literal in the body is a class value.
 */
const CLASS_MAP_DECLARATION = /\bconst\s+[A-Z][A-Z0-9_]*CLASS[A-Z0-9_]*\b[^=]*=\s*\{/g

const collectClassMapClasses = (source: string, classes: Set<string>): void => {
    for (const match of source.matchAll(CLASS_MAP_DECLARATION)) {
        const openIndex = match.index + match[0].length - 1
        const body = extractBalanced(source, openIndex, '{', '}')
        if (body === null) continue

        for (const literal of body.matchAll(CX_STRING_LITERAL)) {
            addClassTokens(classes, literal[1] ?? literal[2] ?? literal[3] ?? '')
        }
    }
}

/**
 * Names written directly in a `className` attribute, passed to `cx(...)`, or
 * held in a class lookup table.
 */
const collectDeclaredClasses = (sourceDir: string): ReadonlySet<string> => {
    const classes = new Set<string>()
    const files = readFilesDeep(sourceDir, new Set(['.ts', '.tsx']))

    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8')

        for (const match of source.matchAll(CLASS_NAME_ATTRIBUTE)) {
            const value = match[1] ?? match[2] ?? match[3] ?? ''
            addClassTokens(classes, value)
        }

        collectCxClasses(source, classes)
        collectClassMapClasses(source, classes)
    }

    return classes
}

/**
 * Every string literal in the source. Deliberately over-broad: it exists only
 * to decide whether a CSS class is referenced *somewhere*, and a false match
 * there costs nothing while a missed one would report a live class as dead.
 */
const collectReferencedClasses = (sourceDir: string): ReadonlySet<string> => {
    const classes = new Set<string>()
    const files = readFilesDeep(sourceDir, new Set(['.ts', '.tsx']))

    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8')

        for (const match of source.matchAll(STRING_LITERAL)) {
            const words = (match[1] ?? '').split(/\s+/)
            for (const name of words) {
                if (name !== '') classes.add(name)
            }
        }
        for (const match of source.matchAll(CLASS_NAME_ATTRIBUTE)) {
            const value = match[1] ?? match[2] ?? match[3] ?? ''
            for (const name of value.split(/\s+/)) {
                if (name !== '') classes.add(name)
            }
        }
    }

    return classes
}

const compareClassNames = (
    cssClasses: ReadonlySet<string>,
    declaredClasses: ReadonlySet<string>,
    referencedClasses: ReadonlySet<string>
): ClassNameReport => ({
    undefinedInCss: [...declaredClasses]
        .filter((name) => !cssClasses.has(name) && !isDynamic(name))
        .toSorted((left, right) => left.localeCompare(right)),
    unusedInSource: [...cssClasses]
        .filter((name) => !referencedClasses.has(name) && !isDynamic(name))
        .toSorted((left, right) => left.localeCompare(right)),
})

export const collectClassNameReport = (rootDir: string): ClassNameReport =>
    compareClassNames(
        collectCssClasses(path.join(rootDir, 'src/assets/styles')),
        collectDeclaredClasses(path.join(rootDir, 'src')),
        collectReferencedClasses(path.join(rootDir, 'src'))
    )

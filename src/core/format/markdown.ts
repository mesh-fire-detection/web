/**
 * A reader for the Markdown subset the blog posts use.
 *
 * Posts live in a separate repository, so their text arrives as a raw string
 * instead of as typed content. Parsing it into plain data keeps the markup
 * rules intact: pages render these blocks with shared components, and no HTML
 * is ever injected.
 *
 * Supported: front matter, ATX headings, paragraphs with hard breaks, flat
 * bullet and numbered lists, block quotes, fenced code, pipe tables, thematic
 * breaks, and inline strong, emphasis, code, links and bare URLs.
 */

export type MarkdownInline =
    | { readonly kind: 'text'; readonly at: number; readonly text: string }
    | { readonly kind: 'break'; readonly at: number }
    | { readonly kind: 'code'; readonly at: number; readonly text: string }
    | {
          readonly kind: 'strong' | 'emphasis'
          readonly at: number
          readonly children: readonly MarkdownInline[]
      }
    | {
          readonly kind: 'link'
          readonly at: number
          readonly href: string
          readonly children: readonly MarkdownInline[]
      }

/** One run of inline content: a paragraph line, a list item, a table cell. */
type Inlines = readonly MarkdownInline[]

export type MarkdownBlock =
    /** `at` is the zero-based source line, which makes it a stable React key. */
    | {
          readonly kind: 'heading'
          readonly at: number
          readonly level: 1 | 2 | 3 | 4 | 5 | 6
          readonly id: string
          readonly content: Inlines
      }
    | { readonly kind: 'paragraph'; readonly at: number; readonly content: Inlines }
    | { readonly kind: 'quote'; readonly at: number; readonly content: Inlines }
    | {
          readonly kind: 'list'
          readonly at: number
          readonly ordered: boolean
          readonly items: readonly { readonly at: number; readonly content: Inlines }[]
      }
    | {
          readonly kind: 'code'
          readonly at: number
          readonly language: string
          readonly text: string
      }
    | {
          readonly kind: 'table'
          readonly at: number
          readonly align: readonly ('start' | 'end')[]
          readonly header: readonly Inlines[]
          readonly rows: readonly { readonly at: number; readonly cells: readonly Inlines[] }[]
      }
    | { readonly kind: 'rule'; readonly at: number }

export type FrontMatter = Readonly<Record<string, string | readonly string[]>>

const HEADING = /^ {0,3}(?<hashes>#{1,6})\s+(?<text>.*?)\s*#*\s*$/
const FENCE = /^ {0,3}```\s*(?<language>[^\s`]*)\s*$/
const RULE = /^ {0,3}(?<mark>[-*_])(?:\s*\k<mark>){2,}\s*$/
const QUOTE = /^ {0,3}>\s?(?<text>.*)$/
const ITEM = /^ {0,3}(?<marker>[-*+]|\d{1,9}[.)])\s+(?<text>.*)$/
const CONTINUATION = /^\s+\S/
const HARD_BREAK = /\s\s+$/

const isBlank = (line: string): boolean => line.trim().length === 0

const lineAt = (lines: readonly string[], index: number): string => lines[index] ?? ''

const isOrdered = (marker: string): boolean => /\d/.test(marker)

/** `|---|---:|` under a header row is what makes a pipe table a table. */
const isDividerRow = (line: string): boolean =>
    /^[\s|:-]+$/.test(line) && line.includes('-') && line.includes('|')

const isTableStart = (lines: readonly string[], index: number): boolean =>
    lineAt(lines, index).trimStart().startsWith('|') && isDividerRow(lineAt(lines, index + 1))

const opensBlock = (lines: readonly string[], index: number): boolean => {
    const line = lineAt(lines, index)
    return (
        isBlank(line) ||
        HEADING.test(line) ||
        FENCE.test(line) ||
        RULE.test(line) ||
        QUOTE.test(line) ||
        ITEM.test(line) ||
        isTableStart(lines, index)
    )
}

/**
 * Soft-wrapped lines become one sentence; a line ending in two spaces keeps
 * its break. `\n` survives into the inline pass as an explicit break token.
 */
const joinLines = (lines: readonly string[]): string =>
    lines
        .map((line, index) =>
            index === lines.length - 1
                ? line.trim()
                : `${line.trim()}${HARD_BREAK.test(line) ? '\n' : ' '}`
        )
        .join('')

const INLINE =
    /\*\*(?<strong>.+?)\*\*|`(?<code>[^`]+)`|\[(?<label>[^\]]+)\]\((?<href>[^\s)]+)\)|(?<url>https?:\/\/[^\s()<>]*[^\s"'(),.:;<>!?])|\*(?<emphasis>[^\s*](?:[^*]*[^\s*])?)\*|(?<![\p{L}\p{N}])_(?<underscore>[^\s_](?:[^_]*[^\s_])?)_(?![\p{L}\p{N}])|(?<newline>\n)/gu

const inlineToken = (groups: Record<string, string | undefined>, at: number): MarkdownInline => {
    const { strong, code, label, href, url, emphasis, underscore } = groups

    if (strong !== undefined) return { kind: 'strong', at, children: parseInline(strong, at + 2) }
    if (code !== undefined) return { kind: 'code', at, text: code }
    if (label !== undefined && href !== undefined)
        return { kind: 'link', at, href, children: parseInline(label, at + 1) }
    if (url !== undefined)
        return { kind: 'link', at, href: url, children: [{ kind: 'text', at, text: url }] }
    if (emphasis !== undefined)
        return { kind: 'emphasis', at, children: parseInline(emphasis, at + 1) }
    return underscore === undefined
        ? { kind: 'break', at }
        : { kind: 'emphasis', at, children: parseInline(underscore, at + 1) }
}

/**
 * `offset` keeps every token's `at` unique inside one run, including tokens
 * nested in a strong or link, so React keys never collide.
 */
function parseInline(source: string, offset = 0): Inlines {
    const nodes: MarkdownInline[] = []
    let cursor = 0

    for (const match of source.matchAll(INLINE)) {
        const start = match.index
        if (start > cursor)
            nodes.push({ kind: 'text', at: offset + cursor, text: source.slice(cursor, start) })
        nodes.push(inlineToken(match.groups ?? {}, offset + start))
        cursor = start + match[0].length
    }

    if (cursor < source.length)
        nodes.push({ kind: 'text', at: offset + cursor, text: source.slice(cursor) })

    return nodes
}

export function inlineText(content: Inlines): string {
    return content
        .map((node) => {
            switch (node.kind) {
                case 'text':
                case 'code': {
                    return node.text
                }
                case 'break': {
                    return ' '
                }
                case 'strong':
                case 'emphasis':
                case 'link': {
                    return inlineText(node.children)
                }
            }
        })
        .join('')
}

const slug = (text: string): string => {
    const base = text
        .toLowerCase()
        .replaceAll(/[^\p{L}\p{N}]+/gu, '-')
        .replaceAll(/^-+|-+$/g, '')

    if (base.length === 0) return 'section'
    // `document.querySelector('#2026-…')` throws, so an id never starts with a digit.
    return /^\d/.test(base) ? `s-${base}` : base
}

/** Repeated headings would otherwise share an anchor. */
const uniqueId = (taken: Map<string, number>, base: string): string => {
    const seen = taken.get(base) ?? 0
    taken.set(base, seen + 1)
    return seen === 0 ? base : `${base}-${seen + 1}`
}

type Read = { readonly block: MarkdownBlock; readonly next: number }

const readHeading = (lines: readonly string[], start: number, taken: Map<string, number>): Read => {
    const groups = HEADING.exec(lineAt(lines, start))?.groups ?? {}
    const hashes = groups['hashes'] ?? '#'
    const content = parseInline(groups['text'] ?? '')

    return {
        block: {
            kind: 'heading',
            at: start,
            level: Math.min(hashes.length, 6) as 1 | 2 | 3 | 4 | 5 | 6,
            id: uniqueId(taken, slug(inlineText(content))),
            content,
        },
        next: start + 1,
    }
}

const readCode = (lines: readonly string[], start: number): Read => {
    const language = FENCE.exec(lineAt(lines, start))?.groups?.['language'] ?? ''
    const body: string[] = []
    let index = start + 1

    while (index < lines.length && !FENCE.test(lineAt(lines, index))) {
        body.push(lineAt(lines, index))
        index += 1
    }

    return {
        block: { kind: 'code', at: start, language, text: body.join('\n') },
        next: Math.min(index + 1, lines.length),
    }
}

const readQuote = (lines: readonly string[], start: number): Read => {
    const body: string[] = []
    let index = start

    while (index < lines.length) {
        const match = QUOTE.exec(lineAt(lines, index))
        if (!match) break
        body.push(match.groups?.['text'] ?? '')
        index += 1
    }

    return {
        block: { kind: 'quote', at: start, content: parseInline(joinLines(body)) },
        next: index,
    }
}

const splitRow = (line: string): readonly string[] =>
    line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim())

const readTable = (lines: readonly string[], start: number): Read => {
    const header = splitRow(lineAt(lines, start)).map((cell) => parseInline(cell))
    const align = splitRow(lineAt(lines, start + 1)).map((cell) =>
        cell.endsWith(':') && !cell.startsWith(':') ? ('end' as const) : ('start' as const)
    )

    const rows: { at: number; cells: readonly Inlines[] }[] = []
    let index = start + 2

    while (index < lines.length && lineAt(lines, index).trimStart().startsWith('|')) {
        rows.push({
            at: index,
            cells: splitRow(lineAt(lines, index)).map((cell) => parseInline(cell)),
        })
        index += 1
    }

    return { block: { kind: 'table', at: start, align, header, rows }, next: index }
}

const readList = (lines: readonly string[], start: number): Read => {
    const ordered = isOrdered(ITEM.exec(lineAt(lines, start))?.groups?.['marker'] ?? '-')
    const items: { at: number; content: Inlines }[] = []
    let index = start

    while (index < lines.length) {
        const match = ITEM.exec(lineAt(lines, index))
        if (!match || isOrdered(match.groups?.['marker'] ?? '-') !== ordered) break

        const body = [match.groups?.['text'] ?? '']
        const at = index
        index += 1

        // Indented follow-on lines belong to the item they sit under.
        while (index < lines.length && CONTINUATION.test(lineAt(lines, index))) {
            body.push(lineAt(lines, index))
            index += 1
        }

        items.push({ at, content: parseInline(joinLines(body)) })

        // A loose list separates its items with blank lines; it is still one list.
        let ahead = index
        while (ahead < lines.length && isBlank(lineAt(lines, ahead))) ahead += 1
        if (ahead === index) continue
        if (!ITEM.test(lineAt(lines, ahead))) break
        index = ahead
    }

    return { block: { kind: 'list', at: start, ordered, items }, next: index }
}

const readParagraph = (lines: readonly string[], start: number): Read => {
    const body = [lineAt(lines, start)]
    let index = start + 1

    while (index < lines.length && !opensBlock(lines, index)) {
        body.push(lineAt(lines, index))
        index += 1
    }

    return {
        block: { kind: 'paragraph', at: start, content: parseInline(joinLines(body)) },
        next: index,
    }
}

export function parseMarkdown(source: string): readonly MarkdownBlock[] {
    const lines = source.replaceAll('\r\n', '\n').split('\n')
    const taken = new Map<string, number>()
    const blocks: MarkdownBlock[] = []
    let index = 0

    while (index < lines.length) {
        const line = lineAt(lines, index)

        if (isBlank(line)) {
            index += 1
            continue
        }

        const read = (() => {
            if (FENCE.test(line)) return readCode(lines, index)
            if (HEADING.test(line)) return readHeading(lines, index, taken)
            if (RULE.test(line))
                return { block: { kind: 'rule', at: index } as const, next: index + 1 }
            if (QUOTE.test(line)) return readQuote(lines, index)
            if (isTableStart(lines, index)) return readTable(lines, index)
            return ITEM.test(line) ? readList(lines, index) : readParagraph(lines, index)
        })()

        blocks.push(read.block)
        index = Math.max(read.next, index + 1)
    }

    return blocks
}

const FRONT_MATTER_FENCE = /^-{3,}\s*$/
const FRONT_MATTER_KEY = /^(?<key>[A-Za-z][\w-]*):\s*(?<value>.*)$/
const FRONT_MATTER_ITEM = /^\s+-\s+(?<value>.*)$/

const unquote = (value: string): string => {
    if (value.length > 1 && value.startsWith('"') && value.endsWith('"')) {
        try {
            const parsed: unknown = JSON.parse(value)
            return typeof parsed === 'string' ? parsed : value.slice(1, -1)
        } catch {
            return value.slice(1, -1)
        }
    }

    return value.length > 1 && value.startsWith("'") && value.endsWith("'")
        ? value.slice(1, -1).replaceAll("''", "'")
        : value
}

/**
 * The YAML subset the posts use: scalars and `- ` item lists, one level deep.
 * A document without front matter is all body.
 */
export function splitFrontMatter(source: string): {
    readonly data: FrontMatter
    readonly body: string
} {
    const lines = source.replaceAll('\r\n', '\n').split('\n')
    if (!FRONT_MATTER_FENCE.test(lineAt(lines, 0))) return { data: {}, body: source }

    const end = lines.findIndex((line, index) => index > 0 && FRONT_MATTER_FENCE.test(line))
    if (end === -1) return { data: {}, body: source }

    const data: Record<string, string | string[]> = {}
    let listKey: string | undefined

    for (const line of lines.slice(1, end)) {
        const item = FRONT_MATTER_ITEM.exec(line)
        if (item && listKey !== undefined) {
            const bucket = data[listKey]
            if (Array.isArray(bucket)) bucket.push(unquote(item.groups?.['value'] ?? ''))
            continue
        }

        const entry = FRONT_MATTER_KEY.exec(line)
        if (!entry) continue

        const key = entry.groups?.['key'] ?? ''
        const value = entry.groups?.['value'] ?? ''
        if (value.length === 0) {
            listKey = key
            data[key] = []
            continue
        }

        listKey = undefined
        data[key] = unquote(value)
    }

    return { data, body: lines.slice(end + 1).join('\n') }
}

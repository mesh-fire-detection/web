import { describe, expect, it } from 'vitest'

import { inlineText, parseMarkdown, splitFrontMatter } from '@core/format/markdown'

const post = [
    '---',
    'title: "Washington’s 2026 Wildfires"',
    'slug: washington-wildfires-2026',
    'status: draft',
    'date: 2026-09-17',
    'tags:',
    '  - wildfire',
    '  - early detection',
    '---',
    '',
    '# Washington’s 2026 Wildfires',
    '',
    'A fire is a **race** against time.',
    'The clock starts at ignition.',
    '',
    '## The clocks',
    '',
    '> Minutes create options.',
    '',
    '- Detection',
    '- Verification',
    '',
    '1. First  ',
    '   still first',
    '2. Second',
    '',
    '| Fire | Structures |',
    '|---|---:|',
    '| Old Trails | 615 |',
    '',
    '```text',
    'ignition',
    '   ↓',
    'detection',
    '```',
    '',
    '---',
    '',
    'See https://example.org/report and [the map](/map).',
].join('\n')

describe('splitFrontMatter', () => {
    it('reads scalars, quoted strings, and item lists', () => {
        const { data, body } = splitFrontMatter(post)

        expect(data['title']).toBe('Washington’s 2026 Wildfires')
        expect(data['slug']).toBe('washington-wildfires-2026')
        expect(data['date']).toBe('2026-09-17')
        expect(data['tags']).toEqual(['wildfire', 'early detection'])
        expect(body.startsWith('\n# Washington')).toBe(true)
    })

    it('treats a document without front matter as all body', () => {
        const { data, body } = splitFrontMatter('# Title\n\nBody.')

        expect(data).toEqual({})
        expect(body).toBe('# Title\n\nBody.')
    })
})

describe('parseMarkdown', () => {
    const blocks = parseMarkdown(splitFrontMatter(post).body)
    const kinds = blocks.map((block) => block.kind)

    it('reads every block in source order', () => {
        expect(kinds).toEqual([
            'heading',
            'paragraph',
            'heading',
            'quote',
            'list',
            'list',
            'table',
            'code',
            'rule',
            'paragraph',
        ])
    })

    it('gives headings an anchor id that never starts with a digit', () => {
        expect(parseMarkdown('## 2026 in review')[0]).toMatchObject({
            kind: 'heading',
            level: 2,
            id: 's-2026-in-review',
        })
        expect(parseMarkdown('## Clocks\n\n## Clocks')[1]).toMatchObject({ id: 'clocks-2' })
    })

    it('joins soft-wrapped lines and keeps an explicit hard break', () => {
        const [paragraph] = parseMarkdown('one\ntwo')
        expect(paragraph?.kind === 'paragraph' && inlineText(paragraph.content)).toBe('one two')

        const [broken] = parseMarkdown('one  \ntwo')
        expect(broken?.kind === 'paragraph' && broken.content.map((node) => node.kind)).toEqual([
            'text',
            'break',
            'text',
        ])
    })

    it('separates bullet and numbered lists and keeps item continuations', () => {
        const [bullets, numbers] = blocks.filter((block) => block.kind === 'list')

        expect(bullets?.ordered).toBe(false)
        expect(bullets?.items.map((item) => inlineText(item.content))).toEqual([
            'Detection',
            'Verification',
        ])
        expect(numbers?.ordered).toBe(true)
        expect(numbers?.items.map((item) => inlineText(item.content))).toEqual([
            'First still first',
            'Second',
        ])
    })

    it('reads a pipe table with its column alignment', () => {
        const table = blocks.find((block) => block.kind === 'table')

        expect(table?.align).toEqual(['start', 'end'])
        expect(table?.header.map((cell) => inlineText(cell))).toEqual(['Fire', 'Structures'])
        expect(table?.rows[0]?.cells.map((cell) => inlineText(cell))).toEqual(['Old Trails', '615'])
    })

    it('keeps fenced code verbatim', () => {
        const code = blocks.find((block) => block.kind === 'code')

        expect(code?.language).toBe('text')
        expect(code?.text).toBe('ignition\n   ↓\ndetection')
    })

    it('reads strong runs, bare URLs, and inline links', () => {
        const [, paragraph] = blocks
        expect(paragraph?.kind === 'paragraph' && paragraph.content[1]).toMatchObject({
            kind: 'strong',
        })

        const closing = blocks.at(-1)
        const links =
            closing?.kind === 'paragraph'
                ? closing.content.filter((node) => node.kind === 'link')
                : []

        expect(links.map((link) => link.href)).toEqual(['https://example.org/report', '/map'])
        expect(links.map((link) => inlineText(link.children))).toEqual([
            'https://example.org/report',
            'the map',
        ])
    })

    it('gives every block a distinct key from its source line', () => {
        const positions = blocks.map((block) => block.at)
        expect(new Set(positions).size).toBe(positions.length)
    })
})

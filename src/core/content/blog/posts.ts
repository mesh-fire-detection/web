import type { BlogPost } from '@core/content/types'
import {
    inlineText,
    parseMarkdown,
    splitFrontMatter,
    type FrontMatter,
} from '@core/format/markdown'

/**
 * Posts are written in the sibling `blog` repository; `@blog` points at that
 * checkout (see `config/build/vite.config.ts`). A missing checkout yields no
 * posts rather than a build failure, so this repo still builds on its own.
 */
const sources = import.meta.glob<string>('@blog/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
})

const text = (data: FrontMatter, key: string): string | undefined => {
    const value = data[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
}

const list = (data: FrontMatter, key: string): readonly string[] => {
    const value = data[key]
    if (value === undefined) return []
    return typeof value === 'string' ? [value] : value
}

const fileName = (file: string): string => file.slice(file.lastIndexOf('/') + 1)

/** `01-washington-wildfires-2026.md` → `washington-wildfires-2026`. */
const fallbackSlug = (file: string): string =>
    fileName(file)
        .replace(/\.md$/, '')
        .replace(/^\d+[-_]/, '')

const toPost = ([file, source]: readonly [string, string]): BlogPost => {
    const { data, body } = splitFrontMatter(source)
    const blocks = parseMarkdown(body)
    const [first, ...rest] = blocks
    const lead = blocks.find((block) => block.kind === 'paragraph')
    const heading = first?.kind === 'heading' && first.level === 1 ? first : undefined

    return {
        slug: text(data, 'slug') ?? fallbackSlug(file),
        title: text(data, 'title') ?? (heading ? inlineText(heading.content) : fallbackSlug(file)),
        date: text(data, 'date') ?? '',
        excerpt: text(data, 'excerpt') ?? (lead ? inlineText(lead.content) : ''),
        tags: list(data, 'tags'),
        draft: text(data, 'status') === 'draft',
        // The page header already carries the title; repeating the H1 stutters.
        blocks: heading ? rest : blocks,
    }
}

const byNewestFirst = (left: BlogPost, right: BlogPost): number =>
    right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug)

export const blogPosts = Object.entries(sources)
    .map((entry) => toPost(entry))
    .toSorted(byNewestFirst) satisfies readonly BlogPost[]

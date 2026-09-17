import type { BlogContent } from '@core/content/types'

export const blogContent = {
    title: 'Blog',
    eyebrow: 'Field notes',
    lede: 'Notes on wildfire seasons, the detection market, and what a cheap sensor network can and cannot do about either.',
    draftLabel: 'Draft',
    emptyTitle: 'No posts checked out',
    emptyBody:
        'Posts live in the sibling blog repository. Clone it next to this one, or point BLOG_DIR at it, and they appear here.',
    backCta: 'All posts',
} as const satisfies BlogContent

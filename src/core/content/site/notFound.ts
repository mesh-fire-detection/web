import type { NotFoundContent } from '@core/content/types'

export const notFoundContent = {
    code: '404',
    title: 'No node here.',
    lede: 'This page does not exist, which at least is a failure we can show you honestly.',
    homeCta: 'Back to the map',
    buildCta: 'Build a node instead',
} as const satisfies NotFoundContent

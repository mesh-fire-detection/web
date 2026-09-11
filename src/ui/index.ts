/**
 * The primitive layer. Everything the rest of the app builds from, and the only
 * place raw HTML tags appear.
 *
 *   core/     — text, layout and iconography
 *   controls/ — anything the user clicks or types into
 *   display/  — presenting data: badges, lists, tables
 *
 * Consumers import from '@/ui' and never from a subfolder, so the grouping can
 * change without touching a single page.
 */
export * from './core/Text'
export * from './core/Layout'
export * from './core/Icon'

export * from './controls/Action'
export type { ExternalHref } from './controls/ExternalLink'
export * from './controls/Field'
export { NavHit } from './controls/NavHit'

export * from './display/Badge'
export * from './display/List'
export * from './display/Table'

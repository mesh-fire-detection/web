// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { MarkdownBody } from '@components/pages/blog/Markdown'
import { parseMarkdown } from '@core/format/markdown'

const renderMarkdown = (source: string) =>
    render(
        <MemoryRouter>
            <MarkdownBody blocks={parseMarkdown(source)} />
        </MemoryRouter>
    )

describe('MarkdownBody', () => {
    it('renders headings, lists, and tables through the shared components', () => {
        renderMarkdown(
            [
                '## The clocks',
                '',
                '- Detection',
                '- Verification',
                '',
                '| Fire | Structures |',
                '|---|---:|',
                '| Old Trails | 615 |',
            ].join('\n')
        )

        expect(screen.getByRole('heading', { name: 'The clocks', level: 2 })).toBeTruthy()
        expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
            'Detection',
            'Verification',
        ])
        expect(screen.getByRole('table')).toBeTruthy()
        expect(screen.getByRole('columnheader', { name: 'Structures' })).toBeTruthy()
    })

    it('gives a heading the anchor id the parser assigned', () => {
        const { container } = renderMarkdown('## Open problems')

        expect(container.querySelector('#open-problems')).toBeTruthy()
    })

    it('renders a link without leaving the markup rules', () => {
        renderMarkdown('See [the map](/map) and https://example.org/report.')

        const internal = screen.getByRole('link', { name: 'the map' })
        expect(internal.getAttribute('href')).toBe('/map')

        const external = screen.getByRole('link', { name: 'https://example.org/report' })
        expect(external.getAttribute('rel')).toBe('noopener noreferrer')
    })
})

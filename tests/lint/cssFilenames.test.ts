import { describe, expect, it } from 'vitest'

import { CSS_FILENAME_PATTERN } from '@config/lint/structure/rules'

describe('css filenames', () => {
    it.each(['app_shell.css', 'reading_column.css', 'tokens.css', 'grid_2_col.css'])(
        'accepts %s',
        (name) => {
            expect(CSS_FILENAME_PATTERN.test(name)).toBe(true)
        }
    )

    it.each(['AppShell.css', 'reading-column.css', 'app__shell.css', '_leading.css'])(
        'rejects %s',
        (name) => {
            expect(CSS_FILENAME_PATTERN.test(name)).toBe(false)
        }
    )
})

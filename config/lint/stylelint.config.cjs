const path = require('node:path')

const repoRoot = path.resolve(__dirname, '../..')

module.exports = {
    extends: ['stylelint-config-standard'],
    plugins: ['stylelint-declaration-strict-value'],
    ignoreFiles: [`${repoRoot}/dist/**/*`, `${repoRoot}/node_modules/**/*`],
    rules: {
        'selector-class-pattern': [
            '^[a-z][a-z0-9]*(_[a-z0-9]+)*$',
            { message: 'Use snake_case for class names (e.g. app_shell, reading_column).' },
        ],
        'custom-property-pattern': [
            '^[a-z][a-z0-9]*(_[a-z0-9]+)*$',
            { message: 'Use snake_case for custom properties (e.g. --space_md, --font_sans).' },
        ],
        'no-descending-specificity': true,
        'no-duplicate-selectors': true,
        'declaration-no-important': true,
        'selector-max-id': null,
        'max-nesting-depth': 3,
        'color-named': 'never',
        'color-hex-length': null,
        'property-no-deprecated': null,
        'declaration-block-no-duplicate-properties': [
            true,
            { ignore: ['consecutive-duplicates-with-same-prefixless-values'] },
        ],
        'property-no-unknown': [true, { ignoreProperties: ['text-wrap'] }],
        'property-no-vendor-prefix': [
            true,
            {
                ignoreProperties: [
                    'backdrop-filter',
                    '-webkit-backdrop-filter',
                    'mask-image',
                    '-webkit-mask-image',
                    'text-size-adjust',
                    '-webkit-text-size-adjust',
                ],
            },
        ],
        'value-keyword-case': ['lower', { ignoreProperties: ['font-family'] }],
        'custom-property-empty-line-before': null,
        'number-max-precision': 5,
        'scale-unlimited/declaration-strict-value': [
            [
                '/color$/',
                'fill',
                'stroke',
                'background',
                'font-size',
                '/^margin/',
                '/^padding/',
                'gap',
                'row-gap',
                'column-gap',
            ],
            {
                ignoreVariables: true,
                ignoreFunctions: true,
                ignoreValues: {
                    '/color$/': ['currentColor', 'transparent', 'inherit', 'none'],
                    fill: ['none', 'currentColor', 'transparent'],
                    stroke: ['none', 'currentColor', 'transparent'],
                    background: ['transparent', 'none', 'inherit'],
                    'font-size': ['inherit'],
                    '/^margin/': ['0', 'auto'],
                    '/^padding/': ['0'],
                    gap: ['0'],
                    'row-gap': ['0'],
                    'column-gap': ['0'],
                },
            },
        ],
        'declaration-property-value-disallowed-list': [
            {
                '/^(margin|padding)/': [/\d(px|rem|em)/],
                '/^(row-|column-)?gap$/': [/\d(px|rem|em)/],
                '/color$/': [/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/],
                background: [/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/],
                fill: [/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/],
                stroke: [/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/],
            },
            {
                message:
                    'Raw value wrapped in a function. Spacing and colour come from tokens in src/assets/styles/tokens/.',
            },
        ],
    },
}

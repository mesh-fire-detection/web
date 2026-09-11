import path from 'node:path'

import eslintReact from '@eslint-react/eslint-plugin'
import js from '@eslint/js'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin, { createNodeResolver } from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import unicorn from 'eslint-plugin-unicorn'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const repoRoot = path.resolve(import.meta.dirname, '../..')

/**
 * Neutral host elements only: everything else carries default user-agent
 * presentation. Exceptions are file-scoped below, matching Virtualization.
 */
const ALLOWED_ELEMENTS = ['div', 'span', 'nav', 'main', 'header', 'footer', 'section', 'article']

const hostElementRule = (allowed) => ({
    selector: `JSXOpeningElement > JSXIdentifier[name=/^(?!(?:${allowed.join('|')})$)[a-z]/]`,
    message: `Only neutral host elements are allowed here (${allowed.join(', ')}). Everything else carries default user-agent presentation: use a neutral element plus a CSS class, or an existing component.`,
})

const hrefRule = {
    selector: 'JSXOpeningElement[name.name=/^[a-z]/] > JSXAttribute[name.name="href"]',
    message:
        'Client navigation goes through the router: use NavHit. For another origin, use ExternalLink.',
}

const inlineStyleRule = {
    selector: 'JSXAttribute[name.name="style"] ObjectExpression',
    message:
        'Inline style objects are banned. Use CSS classes and tokens; CSS custom properties may be set only in allowlisted components.',
}

const markupRestrictedSyntax = [hostElementRule(ALLOWED_ELEMENTS), hrefRule, inlineStyleRule]

const promoteWarnings = (rules) =>
    Object.fromEntries(
        Object.entries(rules).map(([name, entry]) => {
            const [level, ...options] = Array.isArray(entry) ? entry : [entry]
            const isWarning = level === 'warn' || level === 1

            return [name, isWarning ? ['error', ...options] : entry]
        })
    )

export default tseslint.config(
    {
        ignores: ['dist', 'node_modules', 'data', 'logs', 'coverage', 'public'],
    },

    {
        files: ['**/*.{js,mjs,cjs}'],
        ...js.configs.recommended,
        languageOptions: {
            globals: { ...globals.node },
            ecmaVersion: 'latest',
        },
    },
    {
        files: ['**/*.cjs'],
        languageOptions: { sourceType: 'commonjs' },
    },

    ...tseslint.configs.strictTypeChecked.map((config) => ({
        ...config,
        files: ['**/*.{ts,tsx}'],
    })),
    ...tseslint.configs.stylisticTypeChecked.map((config) => ({
        ...config,
        files: ['**/*.{ts,tsx}'],
    })),
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: repoRoot,
                sourceType: 'module',
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
            },
            globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            ...eslintReact.configs['recommended-typescript'].plugins,
            'react-hooks': reactHooks,
            'jsx-a11y': jsxA11y,
            import: importPlugin,
            unicorn,
        },
        settings: {
            'import-x/resolver-next': [
                createTypeScriptImportResolver({
                    alwaysTryTypes: true,
                    project: path.resolve(repoRoot, 'tsconfig.json'),
                }),
                createNodeResolver({
                    extensions: ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.d.ts'],
                }),
            ],
        },
        rules: {
            ...promoteWarnings(eslintReact.configs['recommended-typescript'].rules),
            ...promoteWarnings(reactHooks.configs.recommended.rules),
            ...promoteWarnings(unicorn.configs.recommended.rules),
            '@typescript-eslint/no-shadow': 'error',
            'no-console': 'error',
            'import/no-cycle': 'error',
            'import/no-duplicates': 'error',
            'import/no-self-import': 'error',
            'import/no-useless-path-segments': 'error',
            'import/no-empty-named-blocks': 'error',
            'import/no-restricted-paths': [
                'error',
                {
                    basePath: repoRoot,
                    zones: [
                        {
                            target: './src/lib',
                            from: ['./src/ui', './src/layout', './src/components', './src/pages'],
                            message: 'lib must not import from ui, layout, components, or pages.',
                        },
                        {
                            target: './src/data',
                            from: ['./src/ui', './src/layout', './src/components', './src/pages'],
                            message: 'data must not import from ui, layout, components, or pages.',
                        },
                        {
                            target: './src/ui',
                            from: ['./src/pages', './src/components', './src/layout'],
                            message: 'ui must not import from pages, components, or layout.',
                        },
                        {
                            target: './src/layout',
                            from: './src/pages',
                            message: 'layout must not import from pages.',
                        },
                    ],
                },
            ],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/restrict-template-expressions': [
                'error',
                { allowNumber: true, allowBoolean: true },
            ],
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'unicorn/filename-case': [
                'error',
                { cases: { camelCase: true, pascalCase: true }, ignore: ['vite.config.ts'] },
            ],
            'unicorn/prevent-abbreviations': 'off',
            'unicorn/name-replacements': 'off',
            'unicorn/consistent-boolean-name': 'off',
            'unicorn/single-line-block-comment-style': 'off',
            'unicorn/no-typeof-undefined': 'off',
            'unicorn/prefer-string-raw': 'off',
            'unicorn/no-null': 'off',
            'unicorn/prefer-global-this': 'off',
            '@eslint-react/no-context-provider': 'off',
            '@eslint-react/no-use-context': 'off',
        },
    },

    {
        files: ['src/**/*.tsx'],
        rules: {
            ...promoteWarnings(jsxA11y.flatConfigs.recommended.rules),
            'jsx-a11y/no-noninteractive-tabindex': 'off',
            'no-restricted-syntax': ['error', ...markupRestrictedSyntax],
        },
    },

    {
        files: ['src/ui/controls/ExternalLink.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                hostElementRule([...ALLOWED_ELEMENTS, 'a']),
                inlineStyleRule,
            ],
        },
    },

    {
        files: ['src/ui/controls/Field.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                hostElementRule([...ALLOWED_ELEMENTS, 'input', 'select', 'option', 'label']),
                hrefRule,
                inlineStyleRule,
            ],
        },
    },

    {
        files: ['src/ui/core/Icon.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                hostElementRule([...ALLOWED_ELEMENTS, 'svg', 'path', 'circle', 'rect']),
                hrefRule,
                inlineStyleRule,
            ],
        },
    },

    {
        files: ['src/layout/Wordmark.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                hostElementRule([...ALLOWED_ELEMENTS, 'svg', 'path', 'circle']),
                hrefRule,
                inlineStyleRule,
            ],
        },
    },

    {
        files: ['src/components/coverage/LinkProfile.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                hostElementRule([
                    ...ALLOWED_ELEMENTS,
                    'svg',
                    'path',
                    'line',
                    'circle',
                    'linearGradient',
                    'stop',
                    'text',
                    'defs',
                    'clipPath',
                    'rect',
                ]),
                hrefRule,
                inlineStyleRule,
            ],
        },
    },

    {
        files: [
            'src/ui/core/Layout.tsx',
            'src/ui/core/Text.tsx',
            'src/ui/display/Table.tsx',
            'src/components/network/NetworkMap.tsx',
            'src/components/network/LazyNetworkMap.tsx',
        ],
        rules: {
            'no-restricted-syntax': ['error', hostElementRule(ALLOWED_ELEMENTS), hrefRule],
        },
    },

    {
        files: ['src/**/*.{ts,tsx}'],
        rules: {
            'import/no-default-export': 'error',
        },
    },

    {
        files: [
            'src/components/**/*.tsx',
            'src/ui/**/*.tsx',
            'src/layout/**/*.tsx',
            'src/pages/**/*.tsx',
        ],
        rules: {
            'unicorn/filename-case': ['error', { case: 'pascalCase', checkDirectories: false }],
        },
    },
    {
        files: ['src/lib/**/*.ts', 'src/data/**/*.ts'],
        rules: {
            'unicorn/filename-case': ['error', { case: 'camelCase', checkDirectories: false }],
        },
    },

    {
        files: ['config/lint/checkStructure.ts'],
        rules: {
            'unicorn/no-process-exit': 'off',
            'no-console': 'off',
        },
    },

    eslintConfigPrettier
)

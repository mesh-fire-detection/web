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

const contentPlugin = {
    rules: {
        'require-satisfies': {
            meta: {
                type: 'problem',
                schema: [],
                messages: {
                    missing:
                        'A content export must close with `as const satisfies <shape>` from @core/content/types, so a page and its content cannot drift apart.',
                },
            },
            create(context) {
                return {
                    'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator'(node) {
                        if (node.init?.type === 'TSSatisfiesExpression') return

                        context.report({ node, messageId: 'missing' })
                    },
                }
            },
        },
    },
}

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
                            target: './src/core',
                            from: './src/components',
                            message: 'core must not import from components.',
                        },
                        {
                            target: './src/core/config',
                            from: './src/core/content',
                            message: 'core/config must not import from core/content.',
                        },
                        {
                            target: './src/components/shared',
                            from: './src/components/pages',
                            message: 'shared must not import from pages.',
                        },
                        {
                            target: './src/components/layout',
                            from: './src/components/pages',
                            message: 'layout must not import from pages.',
                        },
                        {
                            target: './src/components/pages/coverage',
                            from: './src/components/pages/problems',
                            message: 'coverage pages must not import problems pages.',
                        },
                        {
                            target: './src/components/pages/problems',
                            from: './src/components/pages/coverage',
                            message: 'problems pages must not import coverage pages.',
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
                {
                    cases: { camelCase: true, pascalCase: true },
                    ignore: ['vite.config.ts', 'vitest.config.ts'],
                },
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
        files: ['src/components/shared/navigation/ExternalLink.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                hostElementRule([...ALLOWED_ELEMENTS, 'a']),
                inlineStyleRule,
            ],
        },
    },

    {
        files: ['src/components/shared/widgets/Field.tsx'],
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
        files: ['src/components/shared/widgets/Icon.tsx'],
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
        files: ['src/components/layout/Wordmark.tsx'],
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
        files: ['src/components/pages/coverage/LinkProfile.tsx'],
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
            'src/components/shared/primitives/Layout.tsx',
            'src/components/shared/typography/Text.tsx',
            'src/components/shared/typography/Heading.tsx',
            'src/components/shared/page/DataTable.tsx',
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
        files: ['src/components/**/*.tsx'],
        rules: {
            'unicorn/filename-case': ['error', { case: 'pascalCase', checkDirectories: false }],
        },
    },
    {
        files: ['src/components/**/*.ts'],
        rules: {
            'unicorn/filename-case': ['error', { case: 'camelCase', checkDirectories: false }],
        },
    },
    {
        files: ['src/core/**/*.{ts,tsx}'],
        rules: {
            'unicorn/filename-case': ['error', { case: 'camelCase', checkDirectories: false }],
        },
    },

    {
        files: ['src/core/content/**/*.ts'],
        ignores: ['src/core/content/types.ts'],
        plugins: { content: contentPlugin },
        rules: {
            'content/require-satisfies': 'error',
        },
    },

    {
        files: ['config/lint/checkStructure.ts'],
        rules: {
            'unicorn/no-process-exit': 'off',
            'no-console': 'off',
        },
    },

    {
        files: ['tests/**/*.{ts,tsx}'],
        rules: {
            'unicorn/consistent-function-scoping': 'off',
            'unicorn/no-top-level-assignment-in-function': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            'no-restricted-syntax': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    },

    eslintConfigPrettier
)

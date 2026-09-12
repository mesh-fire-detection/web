import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const live = process.env['VITEST_LIVE'] === '1'

export default defineConfig({
    root: rootDir,
    plugins: [react()],
    resolve: {
        alias: {
            '@config': path.join(rootDir, 'config'),
            '@core': path.join(rootDir, 'src/core'),
            '@components': path.join(rootDir, 'src/components'),
            '@assets': path.join(rootDir, 'src/assets'),
        },
    },
    test: {
        environment: 'node',
        setupFiles: [path.join(rootDir, 'tests/setup.ts')],
        include: live ? ['tests/**/*.live.test.ts'] : ['tests/**/*.test.{ts,tsx}'],
        exclude: live ? ['node_modules/**', 'dist/**'] : ['tests/**/*.live.test.ts'],
        globals: false,
        restoreMocks: true,
    },
})

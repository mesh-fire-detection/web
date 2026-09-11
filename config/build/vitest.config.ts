import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

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
        include: ['tests/**/*.test.{ts,tsx}'],
        globals: false,
        restoreMocks: true,
    },
})

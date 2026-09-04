import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  // The config lives in config/, the project it builds does not.
  root: projectRoot,
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: false,
  },
})

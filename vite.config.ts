import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@synonymdev/pubky', 'pubky-app-specs'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'pubky-sdk': ['@synonymdev/pubky'],
          'pubky-specs': ['pubky-app-specs'],
          'nostr-tools': ['nostr-tools'],
          'atproto': ['@atproto/api'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['**/._*', '**/node_modules/**', '**/dist/**'],
  },
})

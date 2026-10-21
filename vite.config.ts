/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Every asset becomes a file: data: URIs would need font-src/img-src data: in the Content Security Policy.
  build: { assetsInlineLimit: 0 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Vitest returns '' for CSS unless it is listed here; AR-10 reads index.css as text.
    css: { include: [/src\/index\.css/] },
  },
})

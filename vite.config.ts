import { configDefaults } from 'vitest/config'
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
    // e2e/ is Playwright's, which runs in a real browser (npm run test:a11y).
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Vitest returns '' for CSS unless it is listed here; AR-10 reads index.css as text.
    css: { include: [/src\/index\.css/] },
  },
})

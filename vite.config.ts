/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Vitest returns '' for CSS unless it is listed here; AR-10 reads index.css as text.
    css: { include: [/src\/index\.css/] },
  },
})

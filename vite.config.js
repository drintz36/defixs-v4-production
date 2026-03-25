import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  base: "/defixs-v4-production/",
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})

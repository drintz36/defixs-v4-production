import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  base: "/defix-v2/",
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})

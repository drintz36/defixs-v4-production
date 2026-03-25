import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  base: "/",
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})

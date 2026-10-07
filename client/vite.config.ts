import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Lahat ng /api request ay ipapasa sa Express server
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})

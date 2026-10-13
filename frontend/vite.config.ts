import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@designcodeio/threeui/style.css': path.resolve(import.meta.dirname, './src/shaders/threeui.css'),
      '@designcodeio/threeui': path.resolve(import.meta.dirname, './src/shaders/threeui-entry.tsx'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || (process.env.BACKEND_PORT ? `http://127.0.0.1:${process.env.BACKEND_PORT}` : 'http://127.0.0.1:8000'),
        changeOrigin: true,
      },
    },
  },
})

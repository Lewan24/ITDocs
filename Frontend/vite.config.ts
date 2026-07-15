import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    host: 'localhost',
    port: Number(process.env.PORT ?? 8443),
  },

  preview: {
    host: 'localhost',
    port: Number(process.env.PORT ?? 8443),
  },
})
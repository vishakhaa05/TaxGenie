import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import path from 'path'

const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ...(isTest ? [] : [tailwindcss()])],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-redux": ["@reduxjs/toolkit", "react-redux", "redux-persist"],
          "vendor-charts": ["recharts"],
          "vendor-icons": ["lucide-react"],
          "vendor-table": ["@tanstack/react-table"],
        },
      },
    },
  },
})

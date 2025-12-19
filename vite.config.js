import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment
  // Change 'refrAIme' to your repository name if different
  base: process.env.GITHUB_ACTIONS ? '/refrAIme/' : '/',
})

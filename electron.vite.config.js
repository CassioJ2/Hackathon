import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const embeddedGitHubClientId = process.env.GITHUB_CLIENT_ID || ''

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __EMBEDDED_GITHUB_CLIENT_ID__: JSON.stringify(embeddedGitHubClientId)
    },
    build: {
      minify: true,
      sourcemap: false
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: true,
      sourcemap: false
    }
  },
  renderer: {
    plugins: [react()],
    build: {
      minify: true,
      sourcemap: false
    }
  }
})

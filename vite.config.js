import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Camera AR uses getUserMedia — works on HTTP localhost, HTTPS required for production
// Vercel deploys with HTTPS automatically, no SSL plugin needed
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@babylonjs')) {
            return 'babylon';
          }
        }
      }
    }
  }
})

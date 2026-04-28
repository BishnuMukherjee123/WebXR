import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],

  server: {
    // WebXR REQUIRES HTTPS — even on localhost on most Android browsers.
    // Run `npm run dev` then open https://<your-local-ip>:5173 on your phone.
    https: true,

    // Expose to your local network so your phone can reach it
    host: '0.0.0.0',
    port: 5173,
  },

  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    outDir: 'dist'
  }
})

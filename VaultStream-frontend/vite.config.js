import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for VaultStream-frontend (FINTECH_OS · Core Engine).
// The repo root holds existing static reference materials (assets/, fonts/,
// colors_and_type.css, preview/, ui_kits/) alongside the source under src/.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/auth': { target: 'http://localhost:8081', changeOrigin: true },
      '/api':  { target: 'http://localhost:8081', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

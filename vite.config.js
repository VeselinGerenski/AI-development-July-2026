import { defineConfig } from 'vite';

// Eventide is a single-entry app that uses a client-side hash router,
// so a standard Vite static build is all we need. Deploys as static
// files to Netlify / Vercel / any static host.
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true,
  },
});

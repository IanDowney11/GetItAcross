import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          'three': ['three'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    },
    // Copy public assets
    copyPublicDir: true,
    // Increase chunk size warning limit for Three.js
    chunkSizeWarningLimit: 1000
  },
  publicDir: 'public',
  server: {
    port: 5176
  }
});

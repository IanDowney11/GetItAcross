import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    },
    // Increase chunk size warning limit for Three.js
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5176
  }
});

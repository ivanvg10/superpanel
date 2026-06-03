import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Dev: proxy /api → servidor local (el prefijo se elimina)
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  // Build de producción
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Divide vendor bundle para mejor cache
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          motion:   ['framer-motion'],
          charts:   ['recharts'],
          icons:    ['lucide-react'],
        },
      },
    },
  },
});

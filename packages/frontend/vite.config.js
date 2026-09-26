import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  define: {
    // Make VITE_API_URL available at runtime for production builds
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || ''),
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5001',
      '/uploads': 'http://localhost:5001',
      '/sitemap.xml': 'http://localhost:5001',
      '/robots.txt': 'http://localhost:5001'
    }
  }
});

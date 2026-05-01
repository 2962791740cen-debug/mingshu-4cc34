import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mingshu/',
  server: {
    host: '0.0.0.0',
    port: 5179,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});



import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Esto permite que Vite acepte peticiones desde cualquier subdominio de Cloudflare
    allowedHosts: ['.trycloudflare.com'],
  },
});
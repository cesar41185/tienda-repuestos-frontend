import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Esto permite que Vite acepte peticiones desde cualquier subdominio de Cloudflare
    allowedHosts: ['.trycloudflare.com'],
    host: true, // permite 0.0.0.0
    port: Number(process.env.PORT || 5173),
  },
});
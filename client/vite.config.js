import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El navegador pide /api al mismo origen. En desarrollo Vite lo reenvía a Express.
// Así no necesitamos abrir CORS ni incluir contraseñas del servidor en el frontend.
export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ['..'] }, proxy: { '/api': 'http://127.0.0.1:3000', '/health': 'http://127.0.0.1:3000' } }
});

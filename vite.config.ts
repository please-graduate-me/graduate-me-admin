import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** API 주소를 브라우저에 노출하지 않고 같은 출처로 요청하게 한다. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.API_INTERNAL_URL || 'http://api:4000',
        changeOrigin: false,
      },
    },
  },
});

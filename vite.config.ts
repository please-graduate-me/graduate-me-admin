import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { parsePublicOrigin } from './src/lib/config/publicOrigin';

/** API 주소를 브라우저에 노출하지 않고 같은 출처로 요청하게 한다. */
export default defineConfig(({ mode }) => {
  // Compose 주입값과 Vite 공개 환경 파일 모두 잘못된 외부 이동 설정이면 빌드를 중단한다.
  parsePublicOrigin(loadEnv(mode, process.cwd(), 'VITE_').VITE_STUDENT_URL);

  return {
    base: process.env.ADMIN_BASE_PATH || '/',
    plugins: [
      tanstackRouter({ autoCodeSplitting: true }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
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
  };
});

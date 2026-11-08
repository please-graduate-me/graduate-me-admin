import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** 관리 기능이 추가될 때 해당 앱의 테스트만 실행한다. */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    name: 'admin',
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
    passWithNoTests: true,
  },
});

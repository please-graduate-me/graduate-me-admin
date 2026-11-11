import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from '@/lib/api/request';
import { accessSchema } from '../model/contracts';

/** 계정별 권한을 화면 간 공유하되 재인증 시 다시 확인한다. */
export const accessQuery = queryOptions({
  queryKey: ['workspace', 'access'],
  queryFn: ({ signal }) =>
    request('/api/admin/workspace/access', accessSchema, { signal }),
  staleTime: 30_000,
  retry: false,
});

/** 인증이 준비되지 않은 환경에서 로그인 요청을 보내지 않게 한다. */
export const authStatusQuery = queryOptions({
  queryKey: ['auth', 'status'],
  queryFn: ({ signal }) =>
    request('/api/admin/auth/status', z.object({ configured: z.boolean() }), {
      signal,
    }),
  retry: false,
});

/** 운영 로그인에는 Google 세션 대신 관리자 자격 증명을 전달한다. */
export async function login(username: string, password: string) {
  return request('/api/admin/auth/login', z.object({ ok: z.literal(true) }), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

/** 서버 세션을 폐기한 뒤 관리자 로그인 화면으로 돌아간다. */
export async function logout() {
  await request('/api/admin/auth/logout', z.object({ ok: z.literal(true) }), {
    method: 'POST',
  });

  window.location.assign(
    new URL('login', new URL(import.meta.env.BASE_URL, window.location.origin))
      .href
  );
}

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
    request('/api/auth-status', z.object({ configured: z.boolean() }), {
      signal,
    }),
  retry: false,
});

/** 로그인과 로그아웃은 서버의 CSRF 검증을 거쳐 이동한다. */
export async function authenticate(action: 'signin/google' | 'signout') {
  const { csrfToken } = await request(
    '/api/auth/csrf',
    z.object({ csrfToken: z.string() })
  );

  const callbackUrl = new URL(
    action === 'signout' ? 'login' : '',
    new URL(import.meta.env.BASE_URL, window.location.origin)
  ).href;

  const { url } = await request(
    `/api/auth/${action}`,
    z.object({ url: z.url() }),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Return-Redirect': '1',
      },
      body: new URLSearchParams({ csrfToken, callbackUrl }),
    }
  );

  window.location.assign(url);
}

import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticate } from './auth';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('관리자 배포 출처와 경로의 인증 복귀', () => {
  it.each([
    [
      'https://admin.pleasegraduate.me',
      '/',
      'signin/google',
      'https://admin.pleasegraduate.me/',
    ],
    [
      'https://admin.pleasegraduate.me',
      '/',
      'signout',
      'https://admin.pleasegraduate.me/login',
    ],
    [
      'https://student.example.test',
      '/admin/',
      'signin/google',
      'https://student.example.test/admin/',
    ],
    [
      'https://student.example.test',
      '/admin/',
      'signout',
      'https://student.example.test/admin/login',
    ],
  ] as const)(
    '%s%s의 %s 인증 복귀 주소를 유지한다',
    async (origin, base, action, expected) => {
      vi.stubEnv('BASE_URL', base);
      const assign = vi.fn();

      vi.stubGlobal('window', {
        location: { origin, assign },
      });

      const fetch = vi.fn<
        (path: string, options?: RequestInit) => Promise<Response>
      >(async (path: string) =>
        Response.json(
          path === '/api/auth/csrf'
            ? { csrfToken: 'csrf' }
            : { url: `${origin}/next` }
        )
      );

      vi.stubGlobal('fetch', fetch);
      await authenticate(action);

      const options = fetch.mock.calls[1]?.[1] as RequestInit | undefined;

      expect(options?.body?.toString()).toBe(
        new URLSearchParams({
          csrfToken: 'csrf',
          callbackUrl: expected,
        }).toString()
      );

      expect(fetch.mock.calls.map(([path]) => path)).toEqual([
        '/api/auth/csrf',
        `/api/auth/${action}`,
      ]);

      expect(options?.method).toBe('POST');
      expect(options?.credentials).toBe('same-origin');
      expect(assign).toHaveBeenCalledWith(`${origin}/next`);
    }
  );
});

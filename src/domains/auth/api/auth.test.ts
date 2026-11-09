import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticate } from './auth';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('하위 경로 인증 복귀', () => {
  it.each([
    ['signin/google', 'https://student.example.test/admin/'],
    ['signout', 'https://student.example.test/admin/login'],
  ] as const)(
    '%s 이후에도 관리자 기본 경로를 유지한다',
    async (action, expected) => {
      vi.stubEnv('BASE_URL', '/admin/');
      const assign = vi.fn();

      vi.stubGlobal('window', {
        location: { origin: 'https://student.example.test', assign },
      });

      const fetch = vi.fn<
        (path: string, options?: RequestInit) => Promise<Response>
      >(async (path: string) =>
        Response.json(
          path === '/api/auth/csrf'
            ? { csrfToken: 'csrf' }
            : { url: 'https://student.example.test/next' }
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

      expect(assign).toHaveBeenCalledWith('https://student.example.test/next');
    }
  );
});

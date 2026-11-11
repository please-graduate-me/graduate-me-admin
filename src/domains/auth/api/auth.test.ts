import { afterEach, describe, expect, it, vi } from 'vitest';
import { login, logout } from './auth';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('독립 운영자 인증', () => {
  it('자격 증명을 전용 API로 전달하고 Google 인증을 호출하지 않는다', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));

    vi.stubGlobal('fetch', fetch);
    await login('operator', '테스트 비밀번호');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe('/api/admin/auth/login');

    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      username: 'operator',
      password: '테스트 비밀번호',
    });

    expect(fetch.mock.calls[0][1].credentials).toBe('same-origin');
  });

  it.each(['/', '/admin/'])(
    '로그아웃 후 %s의 로그인 화면으로 돌아간다',
    async (base) => {
      vi.stubEnv('BASE_URL', base);
      const assign = vi.fn();

      vi.stubGlobal('window', {
        location: { origin: 'https://admin.example.test', assign },
      });

      const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));

      vi.stubGlobal('fetch', fetch);
      await logout();
      expect(fetch.mock.calls[0][0]).toBe('/api/admin/auth/logout');

      expect(assign).toHaveBeenCalledWith(
        `https://admin.example.test${base}login`
      );
    }
  );
});

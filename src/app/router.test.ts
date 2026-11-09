import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryClient } from './queryClient';
import { router } from './router';

let role: 'admin' | 'helper' | null = 'admin';
let authenticated = true;

function createTestRouter(path: string) {
  const testRouter = createRouter({
    ...router.options,
    history: createMemoryHistory({ initialEntries: [path] }),
    isServer: true,
  });

  // 서버의 검색 주소 정규화가 권한 판정 검사를 가로막지 않게 한다.
  testRouter.history.replace(
    testRouter.buildLocation({
      to: testRouter.latestLocation.pathname,
      search: true,
      _includeValidateSearch: true,
    }).href
  );

  return testRouter;
}

beforeEach(() => {
  queryClient.clear();
  role = 'admin';
  authenticated = true;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      if (input !== '/api/admin/workspace/access')
        throw new Error('예상하지 않은 API 요청입니다.');

      return new Response(
        JSON.stringify(
          authenticated
            ? {
                role,
                user: {
                  id: 'operator',
                  name: '운영 계정',
                  email: 'operator@example.test',
                },
                languages: ['en'],
                materialIds: ['material-1'],
                canReview: true,
                canRequestEdit: true,
              }
            : { error: '로그인이 필요합니다.' }
        ),
        {
          status: authenticated ? 200 : 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    })
  );
});

afterEach(() => {
  queryClient.clear();
  vi.unstubAllGlobals();
});

describe('관리자 라우팅', () => {
  it('권한을 확인한 운영자에게 대시보드와 같은 QueryClient를 전달한다', async () => {
    const testRouter = createTestRouter('/');

    await testRouter.load();

    expect(testRouter.state.matches.map((match) => match.routeId)).toEqual([
      '__root__',
      '/_dashboard',
      '/_dashboard/',
    ]);

    expect(testRouter.state.matches.at(-1)?.context.queryClient).toBe(
      queryClient
    );

    expect(
      testRouter.state.matches.every((match) => match.status === 'success')
    ).toBe(true);
  });

  it('미로그인 사용자는 운영 데이터를 조회하기 전에 로그인으로 보낸다', async () => {
    authenticated = false;
    const testRouter = createTestRouter('/materials');

    await testRouter.load();

    const result = testRouter._serverResult;

    expect(result?.type === 'redirect' && result.redirect.options.to).toBe(
      '/login'
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('도우미는 운영 전용 주소에서도 내 질문함으로 이동한다', async () => {
    role = 'helper';
    const testRouter = createTestRouter('/helpers');

    await testRouter.load();

    const result = testRouter._serverResult;

    expect(result?.type === 'redirect' && result.redirect.options.to).toBe(
      '/questions'
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('질문 목록의 검색 조건을 주소에서 복원한다', async () => {
    role = 'helper';

    const testRouter = createTestRouter(
      '/questions?q=문맥&status=waiting&page=2'
    );

    await testRouter.load();

    const result = testRouter._serverResult;
    const match = result?.type === 'render' ? result.matches.at(-1) : undefined;

    expect(match?.search).toMatchObject({
      q: '문맥',
      status: 'waiting',
      page: 2,
      period: 'all',
    });

    expect(match?.status).toBe('success');
  });

  it('등록되지 않은 경로는 대시보드 대신 404로 처리한다', async () => {
    const testRouter = createTestRouter('/missing-page');

    await testRouter.load();

    expect(
      renderToString(createElement(RouterProvider, { router: testRouter }))
    ).toContain('페이지를 찾을 수 없습니다');

    expect(
      testRouter.state.matches.map((match) => match.routeId)
    ).not.toContain('/_dashboard/');
  });
});

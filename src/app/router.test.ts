import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { queryClient } from './queryClient';
import { router } from './router';

function createTestRouter(path: string) {
  return createRouter({
    ...router.options,
    history: createMemoryHistory({ initialEntries: [path] }),
    isServer: true,
  });
}

describe('관리자 라우팅', () => {
  it('기본 경로에 대시보드 레이아웃과 화면을 적용하고 같은 QueryClient를 전달한다', async () => {
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

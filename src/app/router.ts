import { createRouter } from '@tanstack/react-router';
import { queryClient } from './queryClient';
import { routeTree } from './routeTree.gen';

/** 생성된 경로와 앱의 QueryClient를 같은 라우터에 연결한다. */
export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreload: 'intent',
  // 사전 조회의 유효 기간은 TanStack Query의 캐시 정책에 맡긴다.
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  /** 경로 이동과 검색 조건에 앱의 라우트 타입을 적용한다. */
  interface Register {
    router: typeof router;
  }
}

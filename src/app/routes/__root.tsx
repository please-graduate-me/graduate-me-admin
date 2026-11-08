import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { NotFound } from './-components/NotFound';
import { RouteError } from './-components/RouteError';

/** 라우트 사전 조회와 화면이 같은 서버 상태 캐시를 사용하게 한다. */
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: Outlet,
    notFoundComponent: NotFound,
    errorComponent: RouteError,
  }
);

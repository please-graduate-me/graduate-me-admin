import { QueryClient } from '@tanstack/react-query';

/** 화면 간 서버 상태를 공유하고 과도한 중복 조회를 줄인다. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
    mutations: { retry: false },
  },
});

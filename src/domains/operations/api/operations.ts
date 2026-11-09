import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';
import { jsonBody, request } from '@/lib/api/request';
import {
  helperSchema,
  materialSchema,
  overviewSchema,
  usageSchema,
  type HelperInput,
} from '../model/contracts';

const base = '/api/admin/workspace';

/** 운영 현황은 서버 집계를 사용한다. */
export const overviewQuery = queryOptions({
  queryKey: ['workspace', 'overview'],
  queryFn: ({ signal }) =>
    request(`${base}/overview`, overviewSchema, { signal }),
});

/** 자료의 처리 상태와 소유 범위만 조회한다. */
export const materialsQuery = queryOptions({
  queryKey: ['workspace', 'materials'],
  queryFn: ({ signal }) =>
    request(`${base}/materials`, z.object({ items: z.array(materialSchema) }), {
      signal,
    }),
});

/** 도우미 배정 목록을 질문 배정과 권한 편집에서 공유한다. */
export const helpersQuery = queryOptions({
  queryKey: ['workspace', 'helpers'],
  queryFn: ({ signal }) =>
    request(`${base}/helpers`, z.object({ items: z.array(helperSchema) }), {
      signal,
    }),
});

/** AI 호출 없이 저장된 작업 이력을 조회한다. */
export const usageQuery = queryOptions({
  queryKey: ['workspace', 'usage'],
  queryFn: ({ signal }) =>
    request(`${base}/usage`, z.object({ items: z.array(usageSchema) }), {
      signal,
    }),
});

/** 배정 변경 후 기존 질문 접근 권한도 다시 판정하게 한다. */
export function useSaveHelper() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: HelperInput) =>
      request(`${base}/helpers`, helperSchema, jsonBody(input)),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['workspace'] });
    },
  });
}

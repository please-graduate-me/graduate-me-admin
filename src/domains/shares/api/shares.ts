import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';
import { jsonBody, request } from '@/lib/api/request';
import { sharesSchema } from '../model/contracts';

/** 서버 페이지와 검색 조건을 캐시 키에 포함한다. */
export const sharesQuery = (page: number, q: string) =>
  queryOptions({
    queryKey: ['shares', page, q],
    queryFn: ({ signal }) =>
      request(
        `/api/admin/shares?${new URLSearchParams({ page: String(page), limit: '20', q })}`,
        sharesSchema,
        { signal }
      ),
  });

/** 공유 중지 후 누적 집계는 보존하며 목록만 갱신한다. */
export function useRevokeShare() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      request(
        `/api/admin/shares/${encodeURIComponent(id)}/revoke`,
        z.object({ ok: z.literal(true) }),
        jsonBody({})
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['shares'] });
    },
  });
}

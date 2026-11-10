import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';
import { jsonBody, request } from '@/lib/api/request';
import { communityReportSchema } from '../model/moderation';

const base = '/api/admin/workspace/community-reports';

/** 게시물 신고 목록도 서버 전체 범위의 검색과 페이지 조건을 적용한다. */
export const communityReportsQuery = (search: {
  page: number;
  q: string;
  status: string;
  period: string;
}) =>
  queryOptions({
    queryKey: ['workspace', 'community-reports', search],
    queryFn: ({ signal }) =>
      request(
        `${base}?${new URLSearchParams({ ...search, page: String(search.page), limit: '20' })}`,
        z.object({
          items: z.array(communityReportSchema),
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          hasMore: z.boolean(),
        }),
        { signal }
      ),
  });

/** 숨김·복원에도 사유와 이전 조회 시각을 요구해 조치 충돌을 막는다. */
export function useModerateCommunity() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status: 'resolved' | 'dismissed';
      resolution: string;
      hidden: boolean;
      expectedUpdatedAt: string;
    }) =>
      request(
        `${base}/${encodeURIComponent(id)}/resolve`,
        z.object({ ok: z.boolean() }),
        jsonBody(body)
      ),
    onSuccess: async () => {
      // 숨김·복원은 신고 목록뿐 아니라 운영 현황의 미처리 수에도 영향을 준다.
      await client.invalidateQueries({ queryKey: ['workspace'] });
    },
  });
}

import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';
import { jsonBody, request } from '@/lib/api/request';
import type { ContentTarget } from '../model/target';
import {
  eventSchema,
  questionDetailSchema,
  questionSchema,
  reviewSchema,
} from '../model/contracts';

const base = '/api/admin/workspace';

const pageFields = {
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
};

type HistorySearch = {
  page: number;
  q: string;
  status: string;
  period: string;
  kind?: string;
};

const historyParams = (search: HistorySearch) =>
  new URLSearchParams({ ...search, page: String(search.page), limit: '20' });

/** 과거 검토 요청도 상태·기간·종류에 맞춰 서버에서 조회한다. */
export const reviewListQuery = (search: HistorySearch) =>
  queryOptions({
    queryKey: ['workspace', 'reviews', 'list', search],
    queryFn: ({ signal }) =>
      request(
        `${base}/reviews?${historyParams(search)}`,
        z.object({ items: z.array(reviewSchema), ...pageFields }),
        { signal }
      ),
  });

/** 최근 목록에 없는 검토 요청도 식별자로 직접 조회한다. */
export const reviewQuery = (id: string) =>
  queryOptions({
    queryKey: ['workspace', 'reviews', id],
    queryFn: ({ signal }) =>
      request(`${base}/reviews/${encodeURIComponent(id)}`, reviewSchema, {
        signal,
      }),
  });

/** 검색과 페이지 이동이 전체 접근 가능한 감사 이력에 적용된다. */
export const eventListQuery = (search: HistorySearch) =>
  queryOptions({
    queryKey: ['workspace', 'events', 'list', search],
    queryFn: ({ signal }) =>
      request(
        `${base}/events?${historyParams(search)}`,
        z.object({ items: z.array(eventSchema), ...pageFields }),
        { signal }
      ),
  });

/** 목록과 배정 작업이 동일한 서버 질문 상태를 참조한다. */
export const questionsQuery = (
  page = 1,
  q = '',
  status = 'all',
  period = 'all'
) =>
  queryOptions({
    queryKey: ['workspace', 'questions', 'list', page, q, status, period],
    queryFn: ({ signal }) =>
      request(
        `${base}/questions?${new URLSearchParams({ page: String(page), limit: '20', q, status, period })}`,
        z.object({
          items: z.array(questionSchema),
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          hasMore: z.boolean(),
          summary: z.object({
            all: z.number(),
            waiting: z.number(),
            answered: z.number(),
            review: z.number(),
          }),
        }),
        {
          signal,
        }
      ),
  });

/** 질문 식별자를 캐시 키에 포함해 다른 질문의 초안이 섞이지 않게 한다. */
export const questionQuery = (id: string) =>
  queryOptions({
    queryKey: ['workspace', 'questions', id],
    queryFn: ({ signal }) =>
      request(
        `${base}/questions/${encodeURIComponent(id)}`,
        questionDetailSchema,
        { signal }
      ),
  });

/** 검토 요청은 역할별 서버 접근 범위 안에서 조회한다. */
export const reviewsQuery = queryOptions({
  queryKey: ['workspace', 'reviews'],
  queryFn: ({ signal }) =>
    request(`${base}/reviews`, z.object({ items: z.array(reviewSchema) }), {
      signal,
    }),
});

/** 내부 감사 이력을 공개 질문 메시지와 별도 조회한다. */
export const eventsQuery = queryOptions({
  queryKey: ['workspace', 'events'],
  queryFn: ({ signal }) =>
    request(`${base}/events`, z.object({ items: z.array(eventSchema) }), {
      signal,
    }),
});

/** 변경 성공 후 질문 상세와 관련 운영 집계만 갱신한다. */
export function useQuestionMutation(id: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (
      input:
        | { action: 'save'; draft?: string; internalNote?: string }
        | { action: 'answer'; body: string }
        | { action: 'assign'; assigneeId: string | null }
        | {
            action: 'reviews';
            scope: 'source' | 'explanation' | 'question';
            version: string;
            reason: string;
            target?: ContentTarget;
          }
    ) => {
      const { action, ...body } = input;
      const suffix = action === 'save' ? '' : `/${action}`;

      return request(
        `${base}/questions/${encodeURIComponent(id)}${suffix}`,
        questionDetailSchema,
        jsonBody(body, action === 'save' ? 'PATCH' : 'POST')
      );
    },
    onSuccess: async (data) => {
      client.setQueryData(questionQuery(id).queryKey, data);

      await Promise.all(
        ['questions', 'reviews', 'events', 'overview'].map((key) =>
          client.invalidateQueries({ queryKey: ['workspace', key] })
        )
      );
    },
  });
}

/** 검토 조치는 실제 상태와 사유 저장으로 처리하고 문제 수정 성공으로 표시하지 않는다. */
export function useResolveReview() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status: 'resolved' | 'dismissed';
      resolution: string;
    }) =>
      request(
        `${base}/reviews/${encodeURIComponent(id)}/resolve`,
        reviewSchema,
        jsonBody(body)
      ),
    onSuccess: async () => {
      await Promise.all(
        ['questions', 'reviews', 'events', 'overview'].map((key) =>
          client.invalidateQueries({ queryKey: ['workspace', key] })
        )
      );
    },
  });
}

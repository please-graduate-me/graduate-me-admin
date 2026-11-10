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
  materialAccessSchema,
  aiUsageResultSchema,
  type HelperInput,
} from '../model/contracts';

const base = '/api/admin/workspace';

const materialListSchema = z.object({
  items: z.array(materialSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

/** 목록의 검색·기간·페이지 조건을 서버의 자료 메타데이터 전체에 적용한다. */
export const materialListQuery = (search: {
  page: number;
  q: string;
  status: string;
  period: string;
}) =>
  queryOptions({
    queryKey: ['workspace', 'materials', 'list', search],
    queryFn: ({ signal }) =>
      request(
        `${base}/materials?${new URLSearchParams({ ...search, page: String(search.page), limit: '20' })}`,
        materialListSchema,
        { signal }
      ),
  });

/** 운영자의 명시적인 PDF·영상 등록만 자료 준비 경로에 전달한다. */
export async function registerAdminMaterial(
  input:
    | {
        kind: 'pdf';
        learningPurposeConfirmed: true;
        title: string;
        language: 'en' | 'th';
        filename: string;
        contentBase64: string;
        pages: string[];
      }
    | {
        kind: 'video';
        url: string;
        language: 'en' | 'th';
        learningPurposeConfirmed: true;
      }
) {
  if (input.kind === 'video') {
    const result = await request(
      '/api/videos',
      z.object({ videoId: z.string() }),
      jsonBody({
        url: input.url,
        language: input.language,
        learningPurposeConfirmed: input.learningPurposeConfirmed,
      })
    );

    return { kind: input.kind, id: result.videoId };
  }

  const { kind, ...body } = input;

  const result = await request(
    '/api/materials',
    z.object({ id: z.string() }),
    jsonBody(body)
  );

  return { kind, id: result.id };
}

/** 운영 현황은 서버 집계를 사용한다. */
export const overviewQuery = queryOptions({
  queryKey: ['workspace', 'overview'],
  queryFn: ({ signal }) =>
    request(`${base}/overview`, overviewSchema, { signal }),
});

/** 자료의 처리 상태와 소유 범위만 조회한다. */
export const materialsQuery = queryOptions({
  queryKey: ['workspace', 'materials'],
  queryFn: async ({ signal }) => {
    const items: z.infer<typeof materialSchema>[] = [];
    // 도우미 배정 선택지에서도 최근 100개 이전 자료를 찾을 수 있게 한다.
    let page = 1;

    while (true) {
      const result = await request(
        `${base}/materials?page=${page}&limit=100`,
        materialListSchema,
        { signal }
      );

      items.push(...result.items);
      if (!result.hasMore) break;
      page += 1;
    }

    return { items };
  },
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

/** 영상 작업 이력과 별도로 실제 AI 실행·토큰·비용 집계를 조회한다. */
export const aiUsageQuery = queryOptions({
  queryKey: ['workspace', 'ai-usage'],
  queryFn: ({ signal }) =>
    request(`${base}/ai-usage`, aiUsageResultSchema, { signal }),
});

/** 자료의 원본 접근 범위와 공유 계정을 조회한다. */
export const materialAccessQuery = (kind: 'pdf' | 'video', id: string) =>
  queryOptions({
    queryKey: ['workspace', 'material-access', kind, id],
    queryFn: ({ signal }) =>
      request(
        `${base}/materials/${encodeURIComponent(id)}/access?${new URLSearchParams({ kind })}`,
        materialAccessSchema,
        { signal }
      ),
  });

/** 공개 범위 변경은 원본 소유권 확인과 함께 서버에 적용한다. */
export function useSaveMaterialAccess(id: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      kind: 'pdf' | 'video';
      visibility: 'private' | 'public' | 'accounts';
      allowedUserIds: string[];
    }) =>
      request(
        `${base}/materials/${encodeURIComponent(id)}/access`,
        materialAccessSchema,
        jsonBody(input, 'PATCH')
      ),
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ['workspace', 'material-access'],
      });

      await client.invalidateQueries({ queryKey: ['workspace', 'materials'] });
    },
  });
}

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

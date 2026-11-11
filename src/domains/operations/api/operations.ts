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
  processingUsageResultSchema,
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
  // 관리자의 등록도 학생과 같은 목적 확인·자료 한도 검사를 우회하지 않는다.
  if (input.kind === 'video') {
    const result = await request(
      '/api/admin/resources/videos',
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
    '/api/admin/resources/materials',
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

/** 저장된 처리 이력의 검색·기간 조건을 페이지 분할 전에 서버에 전달한다. */
export const usageQuery = (search: {
  page: number;
  q: string;
  status: string;
  period: string;
}) =>
  queryOptions({
    queryKey: ['workspace', 'usage', search],
    queryFn: ({ signal }) =>
      request(
        `${base}/usage?${new URLSearchParams({ ...search, page: String(search.page), limit: '20' })}`,
        processingUsageResultSchema,
        { signal }
      ),
  });

/** 실제 AI 이력과 전체 조건 집계를 같은 공급자·기간·검색 조건으로 조회한다. */
export const aiUsageQuery = (search: {
  page: number;
  q: string;
  status: string;
  period: string;
  provider: string;
}) =>
  queryOptions({
    queryKey: ['workspace', 'ai-usage', search],
    queryFn: ({ signal }) =>
      request(
        `${base}/ai-usage?${new URLSearchParams({ ...search, page: String(search.page), limit: '20' })}`,
        aiUsageResultSchema,
        { signal }
      ),
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
      // 공개 범위 편집기와 자료 목록이 이전 접근 상태를 서로 다르게 표시하지 않게 한다.
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
      // 도우미 배정 변경으로 질문·검토의 접근 판정과 운영 집계가 달라질 수 있다.
      await client.invalidateQueries({ queryKey: ['workspace'] });
    },
  });
}

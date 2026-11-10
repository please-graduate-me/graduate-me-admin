import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';
import { jsonBody, request } from '@/lib/api/request';
import {
  assignmentSchema,
  courseDetailSchema,
  courseSchema,
  type AssignmentInput,
} from '../model/contracts';

const base = '/api/courses';
const okSchema = z.object({ ok: z.boolean() });

/** 과제 자료는 전역 관리자 목록 대신 현재 계정이 읽을 수 있는 목록에서 고른다. */
export const assignmentMaterialsQuery = (
  kind: 'pdf' | 'video',
  language: 'en' | 'th',
  q: string,
  page: number
) =>
  queryOptions({
    queryKey: ['assignment-materials', kind, language, q, page],
    queryFn: async ({ signal }) => {
      const result = await request(
        kind === 'pdf'
          ? '/api/materials'
          : `/api/catalog/videos?${new URLSearchParams({ language, q, page: String(page), limit: '50', sort: 'latest' })}`,
        z.object({
          items: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              language: z.enum(['en', 'th']),
              pageCount: z.number().optional(),
            })
          ),
          hasMore: z.boolean().optional(),
        }),
        { signal }
      );

      return {
        ...result,
        items: result.items.filter(
          (item) =>
            item.language === language &&
            item.title.toLowerCase().includes(q.toLowerCase())
        ),
      };
    },
  });

/** 수업 목록은 현재 로그인 계정의 소속만 조회한다. */
export const coursesQuery = queryOptions({
  queryKey: ['courses'],
  queryFn: ({ signal }) =>
    request(base, z.object({ items: z.array(courseSchema) }), { signal }),
});

/** 초대 코드와 학생 목록은 서버의 수업 역할 판정을 따른다. */
export const courseQuery = (id: string) =>
  queryOptions({
    queryKey: ['courses', id],
    queryFn: ({ signal }) =>
      request(`${base}/${encodeURIComponent(id)}`, courseDetailSchema, {
        signal,
      }),
  });

/** 과제별 답안은 수업과 과제 식별자를 모두 캐시 키에 포함한다. */
export const assignmentQuery = (courseId: string, id: string) =>
  queryOptions({
    queryKey: ['courses', courseId, 'assignments', id],
    queryFn: ({ signal }) =>
      request(
        `${base}/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(id)}`,
        assignmentSchema,
        { signal }
      ),
  });

/** 실제 수업 생성 후 계정 소속 목록을 갱신한다. */
export function useCreateCourse() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (body: { title: string; language: 'en' | 'th' }) =>
      request(base, z.object({ id: z.string() }), jsonBody(body)),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

/** 구성원 변경과 배정은 해당 수업의 권한을 서버에서 다시 확인한다. */
export function useCourseMember(courseId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (
      input:
        { userId: string; role: 'assistant' | 'student' } | { remove: string }
    ) =>
      'remove' in input
        ? request(
            `${base}/${encodeURIComponent(courseId)}/members/${encodeURIComponent(input.remove)}`,
            okSchema,
            { method: 'DELETE' }
          )
        : request(
            `${base}/${encodeURIComponent(courseId)}/members`,
            okSchema,
            jsonBody(input)
          ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['courses', courseId] });
    },
  });
}

/** 변경 이유와 기대 버전을 전송해 기존 제출의 기준을 덮어쓰지 않는다. */
export function useSaveAssignment(courseId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      body: AssignmentInput;
      id?: string;
      expectedVersion?: number;
      reason?: string;
    }) =>
      request(
        `${base}/${encodeURIComponent(courseId)}/assignments${input.id ? `/${encodeURIComponent(input.id)}` : ''}`,
        z.object({ id: z.string(), version: z.number() }),
        jsonBody(
          {
            ...input.body,
            ...(input.id
              ? { expectedVersion: input.expectedVersion, reason: input.reason }
              : {}),
          },
          input.id ? 'PATCH' : 'POST'
        )
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['courses', courseId] });
    },
  });
}

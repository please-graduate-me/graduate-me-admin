import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';
import { jsonBody, request } from '@/lib/api/request';
import {
  contentSchema,
  impactSchema,
  revisionSchema,
  type Content,
} from '../model/contracts';

const base = '/api/admin/workspace/content';

const location = (kind: Content['kind'], id: string) =>
  `${base}/${kind}/${encodeURIComponent(id)}`;

/** 질문에서 명시적으로 공유된 콘텐츠만 목록으로 가져온다. */
export const contentQuery = (questionId: string) =>
  queryOptions({
    queryKey: ['workspace', 'content', questionId],
    queryFn: ({ signal }) =>
      request(
        `${base}?${new URLSearchParams({ questionId })}`,
        z.object({ items: z.array(contentSchema) }),
        { signal }
      ),
  });

/** 수정 당시의 버전과 사유를 최신 콘텐츠와 독립적으로 조회한다. */
export const versionsQuery = (
  questionId: string,
  content: Pick<Content, 'kind' | 'id'>
) =>
  queryOptions({
    queryKey: ['workspace', 'versions', questionId, content.kind, content.id],
    queryFn: ({ signal }) =>
      request(
        `${location(content.kind, content.id)}/versions?${new URLSearchParams({ questionId })}`,
        z.object({ items: z.array(revisionSchema) }),
        { signal }
      ),
  });

/** 영향받는 문제·검토와 보존할 과거 답안 수를 확인한다. */
export const contentImpactQuery = (
  questionId: string,
  content: Pick<Content, 'kind' | 'id'>
) =>
  queryOptions({
    queryKey: ['workspace', 'impact', questionId, content.kind, content.id],
    queryFn: ({ signal }) =>
      request(
        `${location(content.kind, content.id)}/impact?${new URLSearchParams({ questionId })}`,
        impactSchema,
        { signal }
      ),
  });

/** 수정·검토·문제 노출 조치를 서버의 버전 충돌 검사와 연결한다. */
export function useContentMutation(questionId: string, content: Content) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (
      input:
        | { action: 'revisions'; payload: Content['payload']; reason: string }
        | {
            action: 'review';
            status: 'verified' | 'needs_review';
            reason: string;
          }
        | { action: 'visibility'; visible: boolean; reason: string }
    ) => {
      const { action, ...body } = input;

      return request(
        `${location(content.kind, content.id)}/${action}`,
        contentSchema,
        jsonBody({
          questionId,
          ...body,
          ...(action === 'revisions'
            ? { expectedVersion: content.version }
            : { version: content.version }),
        })
      );
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['workspace'] });
    },
  });
}

import { z } from 'zod';
import { learningEligibilitySchema } from './policy';

/** 운영 통계는 서버의 실제 처리·질문·검토 집계만 표시한다. */
export const overviewSchema = z.object({
  processing: z.number(),
  waiting: z.number(),
  reviews: z.number(),
  failed: z.number(),
});

/** 자료 목록 계약에는 PDF 원본과 개인 메모를 포함하지 않는다. */
export const materialSchema = z.object({
  eligibility: learningEligibilitySchema.optional(),
  id: z.string(),
  title: z.string(),
  kind: z.enum(['pdf', 'video']),
  language: z.enum(['en', 'th']),
  owner: z.object({ id: z.string(), name: z.string().nullable() }).nullable(),
  pageCount: z.number().nullable(),
  duration: z.number().nullable(),
  status: z.string(),
  createdAt: z.string(),
  visibility: z.enum(['private', 'public', 'accounts']),
});

/** 도우미의 담당 언어·자료와 작업 권한은 개별 필드로 관리한다. */
export const helperSchema = z.object({
  userId: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  languages: z.array(z.enum(['en', 'th'])),
  materialIds: z.array(z.string()),
  canReview: z.boolean(),
  canRequestEdit: z.boolean(),
  canEdit: z.boolean().default(false),
  active: z.boolean(),
});

/** 기존 처리 작업만 조회하며 현재 수집하지 않는 비용 값을 임의로 채우지 않는다. */
export const usageSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  title: z.string(),
  status: z.string(),
  attempts: z.number(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  costKind: z.literal('unavailable'),
  cost: z.null(),
});

/** 원본 접근 권한은 자료 소유자와 공개 정책을 서버에서 검사한 결과를 사용한다. */
export const materialAccessSchema = z.object({
  id: z.string(),
  ownerId: z.string().nullable(),
  kind: z.enum(['pdf', 'video']),
  visibility: z.enum(['private', 'public', 'accounts']),
  allowedUserIds: z.array(z.string()),
  version: z.number(),
});

/** AI 실행별 공급자·작업·실제 토큰과 응답 시간을 보존한다. */
export const aiUsageSchema = z.object({
  id: z.string(),
  provider: z.enum(['naver', 'anthropic', 'gemini']),
  task: z.string(),
  model: z.string(),
  user: z.object({ id: z.string().nullable(), name: z.string().nullable() }),
  sourceKey: z.string(),
  status: z.enum(['running', 'succeeded', 'failed']),
  inputTokens: z.number().nullable(),
  outputTokens: z.number().nullable(),
  elapsedMs: z.number().nullable(),
  estimatedCost: z.number().nullable(),
  actualCost: z.number().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
});

/** 추정 단가와 실제 청구액, 조회 범위의 요청·토큰 합계를 구분한다. */
export const aiUsageResultSchema = z.object({
  items: z.array(aiUsageSchema),
  currency: z.literal('USD'),
  summary: z.object({
    requests: z.number(),
    succeeded: z.number(),
    failed: z.number(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    estimatedCost: z.number().nullable(),
    actualCost: z.number().nullable(),
  }),
  limits: z.object({
    dailyRequests: z.number(),
    dailyTokens: z.number(),
    concurrentRequests: z.number(),
    maxPreparationPages: z.number(),
  }),
});

/** 자료 접근 범위 편집 화면이 검증된 정책만 사용한다. */
export type MaterialAccess = z.infer<typeof materialAccessSchema>;

/** 자료 관리 테이블에서 검증된 응답만 사용한다. */
export type AdminMaterial = z.infer<typeof materialSchema>;

/** 권한 폼의 저장과 표시가 동일한 계약을 사용한다. */
export type Helper = z.infer<typeof helperSchema>;

/** 수정 요청에는 서버가 결정하는 식별자와 표시 이름을 보내지 않는다. */
export type HelperInput = Omit<Helper, 'userId' | 'name' | 'email'> & {
  email: string;
};

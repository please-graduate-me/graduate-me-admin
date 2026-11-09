import { z } from 'zod';

/** 운영 통계는 서버의 실제 처리·질문·검토 집계만 표시한다. */
export const overviewSchema = z.object({
  processing: z.number(),
  waiting: z.number(),
  reviews: z.number(),
  failed: z.number(),
});

/** 자료 목록 계약에는 PDF 원본과 개인 메모를 포함하지 않는다. */
export const materialSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(['pdf', 'video']),
  language: z.enum(['en', 'th']),
  owner: z.object({ id: z.string(), name: z.string().nullable() }).nullable(),
  pageCount: z.number().nullable(),
  duration: z.number().nullable(),
  status: z.string(),
  createdAt: z.string(),
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

/** 자료 관리 테이블에서 검증된 응답만 사용한다. */
export type AdminMaterial = z.infer<typeof materialSchema>;

/** 권한 폼의 저장과 표시가 동일한 계약을 사용한다. */
export type Helper = z.infer<typeof helperSchema>;

/** 수정 요청에는 서버가 결정하는 식별자와 표시 이름을 보내지 않는다. */
export type HelperInput = Omit<Helper, 'userId' | 'name' | 'email'> & {
  email: string;
};

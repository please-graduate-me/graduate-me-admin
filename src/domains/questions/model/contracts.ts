import { z } from 'zod';

const personSchema = z.object({ id: z.string(), name: z.string().nullable() });

const historicalPersonSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
});

/** 발췌 위치는 PDF 페이지와 영상 구간의 서로 다른 계약을 유지한다. */
export const sourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('pdf'),
    materialId: z.string(),
    page: z.number(),
    quote: z.string(),
    title: z.string(),
    language: z.enum(['en', 'th']),
  }),
  z.object({
    kind: z.literal('video'),
    videoId: z.string(),
    youtubeId: z.string().optional(),
    segmentId: z.string(),
    quote: z.string(),
    title: z.string(),
    language: z.enum(['en', 'th']),
    start: z.number().optional(),
    end: z.number().optional(),
  }),
]);

/** 질문 목록에는 답변 초안과 내부 메모를 포함하지 않는다. */
export const questionSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  status: z.enum(['waiting', 'answered']),
  source: sourceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  assignee: personSchema.nullable(),
  author: personSchema,
});

/** 검토 요청은 대상과 버전, 운영 조치 사유를 함께 보존한다. */
export const reviewSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  scope: z.enum(['source', 'explanation', 'question']),
  version: z.string(),
  reason: z.string(),
  status: z.enum(['open', 'resolved', 'dismissed']),
  resolution: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: historicalPersonSchema,
  source: sourceSchema,
});

/** 도우미 상세 응답의 비공개 필드를 학생용 계약과 분리한다. */
export const questionDetailSchema = questionSchema.extend({
  messages: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
      author: historicalPersonSchema,
      kind: z.enum(['question', 'answer']),
      createdAt: z.string(),
    })
  ),
  draft: z.string(),
  internalNote: z.string(),
  reviews: z.array(reviewSchema),
});

/** 공개 답변과 admin 내부 이력의 공개 범위를 구별한다. */
export const eventSchema = z.object({
  id: z.string(),
  questionId: z.string().nullable(),
  action: z.string(),
  detail: z.string(),
  visibility: z.enum(['public', 'internal']),
  actor: historicalPersonSchema,
  createdAt: z.string(),
});

/** 질문 목록과 화면 조합에서 검증된 타입을 사용한다. */
export type Question = z.infer<typeof questionSchema>;

/** 답변 편집 화면은 admin 전용 상세 타입을 사용한다. */
export type QuestionDetail = z.infer<typeof questionDetailSchema>;

/** 조치 화면이 확인할 검토 요청의 계약이다. */
export type ReviewRequest = z.infer<typeof reviewSchema>;

/** 발췌 표시 부품이 원본 자료 전체를 받지 않게 한다. */
export type Source = z.infer<typeof sourceSchema>;

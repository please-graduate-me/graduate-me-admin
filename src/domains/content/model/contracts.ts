import { z } from 'zod';
import { sourceSchema } from '@/domains/questions/model/contracts';

/** 문맥 설명은 원문 번역과 추가 예문·추정을 별도 필드로 유지한다. */
export const explanationPayloadSchema = z.object({
  translation: z.string(),
  meaning: z.string(),
  structure: z.string(),
  concept: z.string(),
  examples: z.array(z.string()),
  uncertainty: z.string(),
  citations: z.array(z.object({ quote: z.string() })),
});

/** 관리자는 정답과 해설을 확인하되 학생에게는 공개 정책에 맞춰 전달한다. */
export const practicePayloadSchema = z.object({
  type: z.enum(['choice', 'short_answer', 'free_response']),
  question: z.string(),
  choices: z.array(z.string()),
  answer: z.string(),
  explanation: z.string(),
  hint: z.string(),
  sourceQuote: z.string(),
});

/** 원문 전사의 시간과 번역·빈칸 후보를 같은 버전으로 편집한다. */
export const segmentPayloadSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  translation: z.string().nullable(),
  blankCandidates: z.array(z.number()).nullable(),
});

const common = {
  id: z.string(),
  version: z.number().int(),
  status: z.enum(['ready', 'suspended']),
  reviewStatus: z.enum(['unreviewed', 'verified', 'needs_review']),
  needsReview: z.boolean(),
  source: sourceSchema,
  model: z.string(),
  provider: z.enum(['naver', 'source']),
  createdAt: z.string(),
  updatedAt: z.string(),
};

/** 명시적으로 공유된 질문에 연결된 원문·설명·문제만 관리 화면에 제공한다. */
export const contentSchema = z.discriminatedUnion('kind', [
  z.object({
    ...common,
    kind: z.literal('explanation'),
    payload: explanationPayloadSchema,
  }),
  z.object({
    ...common,
    kind: z.literal('practice'),
    payload: practicePayloadSchema,
  }),
  z.object({
    ...common,
    kind: z.literal('segment'),
    payload: segmentPayloadSchema,
  }),
]);

/** 수정 전후 내용을 보여 줄 때 당시 상태와 행위자·사유를 함께 보존한다. */
export const revisionSchema = z.object({
  version: z.number(),
  payload: z.union([
    explanationPayloadSchema,
    practicePayloadSchema,
    segmentPayloadSchema,
  ]),
  reason: z.string(),
  actor: z.object({ id: z.string().nullable(), name: z.string() }),
  createdAt: z.string(),
  reviewStatus: z.enum(['unreviewed', 'verified', 'needs_review']),
  status: z.enum(['ready', 'suspended']),
});

/** 연결된 문제·검토 영향과 과거 답안 수만 보여 주고 개인 답안 본문은 받지 않는다. */
export const impactSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      kind: z.string(),
      version: z.number(),
      status: z.string(),
      reviewStatus: z.string(),
      needsReview: z.boolean(),
    })
  ),
  attemptCount: z.number(),
});

/** 콘텐츠 편집은 검증한 대상 계약으로 수행한다. */
export type Content = z.infer<typeof contentSchema>;

/** 이전 버전의 원문·정답·해설 비교에 사용하는 계약이다. */
export type Revision = z.infer<typeof revisionSchema>;

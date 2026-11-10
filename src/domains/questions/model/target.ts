import { z } from 'zod';

/** 검토 요청은 자료 전체가 아닌 명시한 객체와 버전을 참조한다. */
export const targetSchema = z.object({
  kind: z.enum(['explanation', 'practice', 'segment']),
  id: z.string(),
  version: z.number(),
});

/** 검토 요청과 수정 화면에서 사용하는 대상 식별자이다. */
export type ContentTarget = z.infer<typeof targetSchema>;

import { z } from 'zod';

/** 운영 통계와 공유자의 최소 정보만 관리 계약에 포함한다. */
export const sharesSchema = z.object({
  summary: z.object({
    links: z.number(),
    visits: z.number(),
    starts: z.number(),
  }),
  items: z.array(
    z.object({
      id: z.string(),
      createdAt: z.string(),
      revokedAt: z.string().nullable(),
      video: z.object({ title: z.string(), id: z.string() }),
      segment: z.object({ start: z.number(), end: z.number() }).nullable(),
      creator: z
        .object({ name: z.string().nullable(), email: z.string().nullable() })
        .nullable(),
      visitCount: z.number(),
      startCount: z.number(),
    })
  ),
  page: z.number(),
  hasMore: z.boolean(),
});

import { z } from 'zod';
import { sourceSchema } from '@/domains/questions/model/contracts';

/** 게시물 신고는 학습 자료 오류 신고와 별도인 게시 내용·조치 계약이다. */
export const communityReportSchema = z.object({
  id: z.string(),
  reason: z.string(),
  status: z.enum(['open', 'resolved', 'dismissed']),
  resolution: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  reporter: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
  }),
  post: z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    language: z.enum(['en', 'th']),
    visibility: z.enum(['public', 'accounts']),
    hiddenAt: z.string().nullable(),
    source: sourceSchema.nullable(),
  }),
});

/** 운영 조치 화면에는 신고자가 공개한 게시 내용만 전달한다. */
export type CommunityReport = z.infer<typeof communityReportSchema>;

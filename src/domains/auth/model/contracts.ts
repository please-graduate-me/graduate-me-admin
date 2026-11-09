import { z } from 'zod';

/** admin 접근 정보에는 서버가 판정한 역할과 현재 배정 범위만 포함한다. */
export const accessSchema = z.object({
  role: z.enum(['helper', 'admin']).nullable(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  languages: z.array(z.string()),
  materialIds: z.array(z.string()),
  canReview: z.boolean(),
  canRequestEdit: z.boolean(),
});

/** 화면의 역할 표시와 접근 분기에 같은 검증된 계약을 사용한다. */
export type WorkspaceAccess = z.infer<typeof accessSchema>;

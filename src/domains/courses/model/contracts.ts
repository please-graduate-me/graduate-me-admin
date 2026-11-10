import { z } from 'zod';

/** 수업 역할은 전역 도우미·운영 권한과 별도로 검증한다. */
export const courseRoleSchema = z.enum(['teacher', 'assistant', 'student']);

/** 수업 목록에는 소속과 최소 식별 정보만 표시한다. */
export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  language: z.enum(['en', 'th']),
  createdAt: z.string(),
  role: courseRoleSchema,
  ownerUnavailable: z.boolean().default(false),
});

const taskSchema = z.object({
  id: z.string(),
  text: z.string().nullable(),
  version: z.number(),
  start: z.number().optional(),
  end: z.number().optional(),
  page: z.number().optional(),
  blanks: z.array(z.number()),
  units: z.array(z.string().nullable()),
});

/** 과제 답안은 개인 학습 기록을 포함하지 않고 제출 당시 버전을 보존한다. */
export const submissionSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  userId: z.string(),
  version: z.number(),
  answers: z.array(
    z.object({
      id: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
    })
  ),
  result: z.array(
    z.object({
      id: z.string(),
      correct: z.boolean().nullable(),
      expected: z
        .union([z.string(), z.array(z.string())])
        .nullable()
        .optional(),
    })
  ),
  assignmentSnapshot: z
    .object({ title: z.string(), version: z.number() })
    .passthrough(),
  late: z.boolean(),
  createdAt: z.string(),
  studentName: z.string().nullable().optional(),
});

/** 담당자에게만 공개되는 초대 코드와 수업 소속을 응답 계약으로 구분한다. */
export const courseDetailSchema = z.object({
  course: courseSchema.extend({ inviteCode: z.string().optional() }),
  members: z.array(
    z.object({
      userId: z.string(),
      role: courseRoleSchema,
      name: z.string().nullable(),
    })
  ),
  assignments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      version: z.number(),
      mode: z.enum(['full', 'blank', 'reading']),
      dueAt: z.string(),
      allowLate: z.boolean(),
      allowResubmit: z.boolean(),
      source: z.object({
        kind: z.enum(['video', 'pdf']),
        id: z.string(),
        title: z.string(),
      }),
      taskCount: z.number(),
      submission: z
        .object({
          assignmentId: z.string(),
          version: z.number(),
          createdAt: z.string(),
          late: z.boolean(),
        })
        .nullable(),
    })
  ),
});

/** 수정·제출 이력을 최신 과제와 구분해 표시한다. */
export const assignmentSchema = z.object({
  sourceAvailable: z.boolean().default(true),
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  version: z.number(),
  mode: z.enum(['full', 'blank', 'reading']),
  dueAt: z.string(),
  allowLate: z.boolean(),
  allowResubmit: z.boolean(),
  allowHints: z.boolean(),
  revealAfterSubmit: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  source: z.object({
    kind: z.enum(['video', 'pdf']),
    id: z.string(),
    title: z.string(),
    language: z.enum(['en', 'th']),
    version: z.number(),
    fromIndex: z.number().optional(),
    toIndex: z.number().optional(),
    blankRatio: z
      .union([z.literal(20), z.literal(40), z.literal(60)])
      .optional(),
    tasks: z.array(taskSchema),
  }),
  submissions: z.array(submissionSchema),
  revisions: z.array(
    z.object({
      version: z.number(),
      reason: z.string(),
      createdAt: z.string(),
      actorId: z.string().nullable(),
    })
  ),
});

/** 과제 편집은 생성과 수정에서 동일한 자료·제출 정책을 전송한다. */
export type AssignmentInput = {
  title: string;
  videoId?: string;
  materialId?: string;
  fromIndex: number;
  toIndex: number;
  mode: 'full' | 'blank' | 'reading';
  blankRatio: 20 | 40 | 60;
  dueAt: string;
  allowLate: boolean;
  allowResubmit: boolean;
  allowHints: boolean;
  revealAfterSubmit: boolean;
};

/** 검증된 수업 상세를 화면에서 사용한다. */
export type CourseDetail = z.infer<typeof courseDetailSchema>;

/** 검증된 과제·제출 이력을 편집기와 결과 화면에 전달한다. */
export type Assignment = z.infer<typeof assignmentSchema>;

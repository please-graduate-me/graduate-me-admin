import { describe, expect, it } from 'vitest';
import {
  questionSchema,
  reviewSchema,
} from '@/domains/questions/model/contracts';
import { communityReportSchema } from '@/domains/operations/model/moderation';
import { buildOverviewTasks } from './buildOverviewTasks';

const source = {
  kind: 'pdf',
  materialId: 'pdf-1',
  page: 1,
  quote: '근거',
  title: '원본',
  language: 'en',
};

const person = { id: 'user-1', name: null };
const createdAt = '2026-11-01T00:00:00Z';
const updatedAt = '2026-11-02T00:00:00Z';

const question = questionSchema.parse({
  id: 'same',
  title: '기존 질문',
  body: '본문',
  status: 'waiting',
  source,
  author: person,
  assignee: null,
  createdAt,
  updatedAt,
});

const review = reviewSchema.parse({
  id: 'same',
  questionId: 'same',
  scope: 'source',
  version: 'v1',
  reason: '검토',
  status: 'open',
  resolution: null,
  source,
  author: person,
  createdAt,
  updatedAt,
});

const report = communityReportSchema.parse({
  id: 'same',
  reason: '신고',
  status: 'open',
  resolution: null,
  reporter: person,
  createdAt,
  updatedAt,
  post: {
    id: 'post-1',
    title: '신고된 글',
    body: '본문',
    language: 'en',
    visibility: 'public',
    hiddenAt: null,
    source: null,
  },
});

const job = {
  id: 'same',
  title: '실패 영상',
  status: 'failed',
  updatedAt: createdAt,
};

describe('운영 업무 통합', () => {
  it('실패와 신고를 먼저 보여주며 같은 식별자를 가진 다른 종류를 보존한다', () => {
    const tasks = buildOverviewTasks({
      questions: [question],
      reviews: [review],
      community: [report],
      jobs: [job],
    });

    expect(tasks.map((task) => task.kind)).toEqual([
      'failed',
      'community',
      'review',
      'question',
    ]);

    expect(new Set(tasks.map((task) => task.id)).size).toBe(4);
    expect(tasks.every((task) => task.sourceId === 'same')).toBe(true);
    expect(tasks.at(-1)?.actor).toBe('미배정');
  });

  it('종료·반려·공유 철회된 기록을 업무에서 제외한다', () => {
    const tasks = buildOverviewTasks({
      questions: [
        { ...question, revokedAt: updatedAt },
        { ...question, resolvedAt: updatedAt },
        { ...question, status: 'answered' },
      ],
      reviews: [
        { ...review, status: 'resolved' },
        { ...review, status: 'dismissed' },
      ],
      community: [{ ...report, status: 'resolved' }],
      jobs: [{ ...job, status: 'ready' }],
    });

    expect(tasks).toEqual([]);
  });

  it('종류 안에서 최근 변경 순으로 정렬하고 첫 10개 뒤의 업무도 보존한다', () => {
    const jobs = Array.from({ length: 20 }, (_, index) => ({
      ...job,
      id: String(index),
      updatedAt: new Date(Date.parse(createdAt) + index * 1000).toISOString(),
    }));

    const tasks = buildOverviewTasks({
      questions: [],
      reviews: [],
      community: [],
      jobs,
    });

    expect(tasks).toHaveLength(20);
    expect(tasks[0].sourceId).toBe('19');
    expect(tasks.at(-1)?.sourceId).toBe('0');
    expect(jobs[0].id).toBe('0');
  });
});

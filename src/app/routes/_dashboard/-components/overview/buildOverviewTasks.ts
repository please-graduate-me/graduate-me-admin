import type {
  Question,
  ReviewRequest,
} from '@/domains/questions/model/contracts';
import type { CommunityReport } from '@/domains/operations/model/moderation';

/** 통합 업무 목록에서 원본 종류와 식별자를 함께 유지한다. */
export type OverviewTask = {
  id: string;
  sourceId: string;
  kind: 'community' | 'review' | 'question' | 'failed';
  title: string;
  target: string;
  actor: string;
  updatedAt: string;
};

const priority = { failed: 0, community: 1, review: 2, question: 3 };

/** 종료·공유 철회된 기록을 제외하고 실패와 신고를 먼저 보여준다. */
export function buildOverviewTasks(input: {
  community: CommunityReport[];
  reviews: ReviewRequest[];
  questions: Question[];
  jobs: { id: string; title: string; status: string; updatedAt: string }[];
}): OverviewTask[] {
  return [
    ...input.community
      .filter((item) => item.status === 'open')
      .map((item): OverviewTask => ({
        id: `community-${item.id}`,
        sourceId: item.id,
        kind: 'community',
        title: item.reason,
        target: item.post.title,
        actor: item.reporter.name || '이름 없음',
        updatedAt: item.updatedAt,
      })),
    ...input.reviews
      .filter((item) => item.status === 'open')
      .map((item): OverviewTask => ({
        id: `review-${item.id}`,
        sourceId: item.id,
        kind: 'review',
        title: item.reason,
        target: `${item.source.title} · ${item.version}`,
        actor: item.author.name || '이름 없음',
        updatedAt: item.updatedAt,
      })),
    ...input.questions
      .filter(
        (item) =>
          item.status === 'waiting' && !item.revokedAt && !item.resolvedAt
      )
      .map((item): OverviewTask => ({
        id: `question-${item.id}`,
        sourceId: item.id,
        kind: 'question',
        title: item.title,
        target: item.source.title,
        actor: item.assignee?.name || '미배정',
        updatedAt: item.updatedAt,
      })),
    ...input.jobs
      .filter((item) => item.status === 'failed')
      .map((item): OverviewTask => ({
        id: `failed-${item.id}`,
        sourceId: item.id,
        kind: 'failed',
        title: item.title,
        target: '영상 자료 준비',
        actor: '시스템',
        updatedAt: item.updatedAt,
      })),
  ].sort(
    (a, b) =>
      priority[a.kind] - priority[b.kind] ||
      Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
      a.id.localeCompare(b.id)
  );
}

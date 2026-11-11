import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import type { SearchSchemaInput } from '@tanstack/react-router';
import { Button, Card, Segmented, Space, Statistic, Typography } from 'antd';
import { z } from 'zod';
import { usageQuery } from '@/domains/operations/api/operations';
import {
  questionsQuery,
  reviewListQuery,
} from '@/domains/questions/api/questions';
import { communityReportsQuery } from '@/domains/operations/api/moderation';
import { PageHeading } from './-components/PageHeading';
import { QueryError } from './-components/QueryError';
import { OverviewTasks } from './-components/overview/OverviewTasks';
import { OverviewAI } from './-components/overview/OverviewAI';
import { OverviewMaterials } from './-components/overview/OverviewMaterials';
import { buildOverviewTasks } from './-components/overview/buildOverviewTasks';

const searchSchema = z.object({
  period: z.enum(['all', '7', '30']).catch('all'),
  kind: z
    .enum(['all', 'community', 'review', 'question', 'failed'])
    .catch('all'),
});

/** 운영자에게 기간별 집계와 업무·AI·자료 관리 진입점을 제공한다. */
export const Route = createFileRoute('/_dashboard/')({
  validateSearch: (
    raw: Partial<z.infer<typeof searchSchema>> & SearchSchemaInput
  ) => searchSchema.parse({ ...raw, period: String(raw.period ?? 'all') }),
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin')
      throw redirect({ to: context.access.role ? '/questions' : '/courses' });
  },
  component: Overview,
});

function Overview() {
  const { period, kind } = Route.useSearch();
  const navigate = Route.useNavigate();
  const client = useQueryClient();
  const fetching = useIsFetching({ queryKey: ['workspace'] });
  const search = { page: 1, q: '', period };
  const questions = useQuery(questionsQuery(1, '', 'waiting', period));
  const reviews = useQuery(reviewListQuery({ ...search, status: 'open' }));
  const usage = useQuery(usageQuery({ ...search, status: 'all' }));
  const failed = useQuery(usageQuery({ ...search, status: 'failed' }));

  const community = useQuery(
    communityReportsQuery({ ...search, status: 'open' })
  );

  const queries = [questions, reviews, usage, failed, community];
  const incomplete = queries.some((query) => query.isError);
  const loading = queries.some((query) => query.isPending);
  const error = queries.find((query) => query.isError)?.error;

  const tasks = buildOverviewTasks({
    community: community.data?.items ?? [],
    reviews: reviews.data?.items ?? [],
    questions: questions.data?.items ?? [],
    jobs: failed.data?.items ?? [],
  }).filter((task) => kind === 'all' || task.kind === kind);

  const counts = [
    {
      title: '미처리 게시물 신고',
      value: community.data?.total,
      loading: community.isPending,
      link: (
        <Link
          to='/moderation'
          search={{ status: 'open', period }}>
          신고 처리
        </Link>
      ),
    },
    {
      title: '검토 대기',
      value: reviews.data?.total,
      loading: reviews.isPending,
      link: (
        <Link
          to='/reviews'
          search={{ status: 'open', period }}>
          검토하기
        </Link>
      ),
    },
    {
      title: '영상 처리 실패',
      value: usage.data?.summary.failed,
      loading: usage.isPending,
      link: (
        <Link
          to='/usage'
          search={{ view: 'jobs', status: 'failed', period }}>
          실패 확인
        </Link>
      ),
    },
    {
      title: '영상 처리 중',
      value: usage.data?.summary.processing,
      loading: usage.isPending,
      link: (
        <Link
          to='/usage'
          search={{ view: 'jobs', period }}>
          처리 이력
        </Link>
      ),
    },
  ];

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='운영 현황'
        description='처리할 업무부터 AI 실행과 새 자료까지 한곳에서 확인합니다.'
        action={
          <Button
            loading={fetching > 0}
            onClick={() =>
              void client.invalidateQueries({ queryKey: ['workspace'] })
            }>
            집계 갱신
          </Button>
        }
      />
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Segmented<z.infer<typeof searchSchema>['period']>
          aria-label='집계 기간'
          value={period}
          options={[
            { value: 'all', label: '전체 기간' },
            { value: '7', label: '최근 7일' },
            { value: '30', label: '최근 30일' },
          ]}
          onChange={(value) =>
            void navigate({
              search: (previous) => ({ ...previous, period: value }),
              replace: true,
            })
          }
        />
        <Typography.Text type='secondary'>
          선택 기간에 생성된 기록의 현재 상태를 집계합니다.
        </Typography.Text>
      </div>
      {error && (
        <QueryError
          error={error}
          retry={() => {
            queries
              .filter((query) => query.isError)
              .forEach((query) => void query.refetch());
          }}
        />
      )}
      <div className='grid grid-cols-2 gap-5 xl:grid-cols-4'>
        {counts.map(({ title, value, loading: pending, link }) => (
          <Card key={title}>
            <Statistic
              title={title}
              value={value}
              loading={pending}
              formatter={(shown) => (value === undefined ? '미확인' : shown)}
            />
            <div className='mt-3'>{link}</div>
          </Card>
        ))}
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Segmented<z.infer<typeof searchSchema>['kind']>
          aria-label='업무 종류'
          value={kind}
          options={[
            { value: 'all', label: '전체 업무' },
            { value: 'failed', label: '처리 실패' },
            { value: 'community', label: '게시물 신고' },
            { value: 'review', label: '검토 요청' },
            { value: 'question', label: '미답변 기록' },
          ]}
          onChange={(value) =>
            void navigate({
              search: (previous) => ({ ...previous, kind: value }),
              replace: true,
            })
          }
        />
        <Link
          to='/questions'
          search={{ period, status: 'waiting' }}>
          미답변 기록 {questions.data?.total ?? '미확인'}건 보기
        </Link>
      </div>
      <OverviewTasks
        key={`${period}-${kind}`}
        tasks={tasks}
        loading={loading}
        incomplete={incomplete}
        period={period}
      />
      <div className='grid grid-cols-1 items-start gap-5 2xl:grid-cols-[1fr_1.5fr]'>
        <OverviewAI period={period} />
        <OverviewMaterials period={period} />
      </div>
      <Card title='다른 운영 업무'>
        <Space
          size='large'
          wrap>
          <Link
            to='/materials'
            search={{ period }}>
            자료 등록 · 공개 범위 관리
          </Link>
          <Link to='/helpers'>조교 자격 관리</Link>
          <Link to='/shares'>공유 링크 관리</Link>
          <Link
            to='/events'
            search={{ period }}>
            운영 이력 확인
          </Link>
        </Space>
      </Card>
    </section>
  );
}

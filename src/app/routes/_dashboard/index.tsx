import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { Alert, Card, Empty, Statistic, Table, Tag } from 'antd';
import { overviewQuery, usageQuery } from '@/domains/operations/api/operations';
import {
  questionsQuery,
  reviewsQuery,
} from '@/domains/questions/api/questions';
import { formatDate } from '@/domains/questions/lib/format';
import { communityReportsQuery } from '@/domains/operations/api/moderation';
import { PageHeading } from './-components/PageHeading';
import { QueryError } from './-components/QueryError';

/** 운영자는 집계로, 도우미는 배정 질문함으로 진입한다. */
export const Route = createFileRoute('/_dashboard/')({
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin')
      throw redirect({ to: context.access.role ? '/questions' : '/courses' });
  },
  component: Overview,
});

function Overview() {
  const summary = useQuery(overviewQuery);
  const questions = useQuery(questionsQuery());
  const reviews = useQuery(reviewsQuery);
  const usage = useQuery(usageQuery);

  const community = useQuery(
    communityReportsQuery({ page: 1, q: '', status: 'open', period: 'all' })
  );

  const counts = [
    ['자료 처리 중', summary.data?.processing],
    ['미답변 질문', summary.data?.waiting],
    ['검토 요청', summary.data?.reviews],
    ['처리 실패', summary.data?.failed],
  ] as const;

  const tasks = [
    ...(community.data?.items ?? []).map((item) => ({
      id: `post-report-${item.id}`,
      title: item.reason,
      target: item.post.title,
      actor: item.reporter.name,
      status: '게시물 신고',
      updatedAt: item.updatedAt,
      href: '/moderation',
    })),
    ...(reviews.data?.items ?? [])
      .filter((item) => item.status === 'open')
      .map((item) => ({
        id: `review-${item.id}`,
        title: item.reason,
        target: `${item.source.title} · ${item.version}`,
        actor: item.author.name,
        status: '검토 요청',
        updatedAt: item.updatedAt,
        href: `/reviews/${encodeURIComponent(item.id)}`,
      })),
    ...(questions.data?.items ?? [])
      .filter((item) => item.status === 'waiting')
      .map((item) => ({
        id: `question-${item.id}`,
        title: item.title,
        target: item.source.title,
        actor: item.assignee?.name || '미배정',
        status: '답변 대기',
        updatedAt: item.updatedAt,
        href: `/questions/${encodeURIComponent(item.id)}`,
      })),
    ...(usage.data?.items ?? [])
      .filter((item) => item.status.toLowerCase() === 'failed')
      .map((item) => ({
        id: `job-${item.id}`,
        title: item.title,
        target: '영상 자료 준비',
        actor: '시스템',
        status: '처리 실패',
        updatedAt: item.updatedAt,
        href: '/usage',
      })),
  ]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 10);

  const error =
    summary.error ||
    questions.error ||
    reviews.error ||
    usage.error ||
    community.error;

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='운영 현황'
        description='답변, 자료 처리, 검토 요청을 한곳에서 확인합니다.'
      />
      {error && (
        <QueryError
          error={error}
          retry={() => {
            summary.refetch();
            questions.refetch();
            reviews.refetch();
            usage.refetch();
            community.refetch();
          }}
        />
      )}
      <div className='grid grid-cols-4 gap-5'>
        {counts.map(([title, value]) => (
          <Card key={title}>
            <Statistic
              title={title}
              value={value}
              formatter={(shown) => (value === undefined ? '미확인' : shown)}
              loading={summary.isPending}
            />
          </Card>
        ))}
      </div>
      <Table
        rowKey='id'
        dataSource={tasks}
        loading={questions.isPending || reviews.isPending || usage.isPending}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='우선 확인할 업무가 없습니다.'
            />
          ),
        }}
        pagination={false}
        columns={[
          {
            title: '우선 확인할 업무',
            key: 'title',
            width: '36%',
            render: (_, item) => <Link to={item.href}>{item.title}</Link>,
          },
          { title: '대상', dataIndex: 'target' },
          { title: '담당자', dataIndex: 'actor' },
          {
            title: '상태',
            dataIndex: 'status',
            render: (value) => (
              <Tag
                bordered={false}
                color={value === '처리 실패' ? 'red' : 'orange'}>
                {value}
              </Tag>
            ),
          },
          {
            title: '최근 업데이트',
            dataIndex: 'updatedAt',
            render: formatDate,
          },
        ]}
      />
      <Alert
        type='info'
        title='현재 저장된 질문·검토 요청·작업의 상태를 표시합니다. 비용과 학습 시간을 임의로 추정하지 않습니다.'
      />
    </section>
  );
}

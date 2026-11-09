import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Alert,
  Card,
  Empty,
  Space,
  Statistic,
  Table,
  Tabs,
  Typography,
} from 'antd';
import {
  questionsQuery,
  reviewsQuery,
} from '@/domains/questions/api/questions';
import { formatDate, sourceLabel } from '@/domains/questions/lib/format';
import { QuestionStatus } from '@/domains/questions/ui/QuestionStatus';
import { PageHeading } from '../-components/PageHeading';
import { QueryError } from '../-components/QueryError';
import { ListFilters } from '../-components/ListFilters';
import {
  inPeriod,
  parseListSearch,
  type ListSearch,
} from '../-components/listSearch';

/** 배정 질문 목록과 URL 기반 상태·검색 조건을 연결한다. */
export const Route = createFileRoute('/_dashboard/questions/')({
  validateSearch: parseListSearch,
  component: Questions,
});

function Questions() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(questionsQuery(search.page, search.q));
  const reviews = useQuery(reviewsQuery);
  const { access } = Route.useRouteContext();
  const items = query.data?.items ?? [];

  const reviewIds = new Set(
    (reviews.data?.items ?? [])
      .filter((item) => item.status === 'open')
      .map((item) => item.questionId)
  );

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const filtered = items.filter(
    (item) =>
      (search.status === 'all' ||
        item.status === search.status ||
        (search.status === 'review' && reviewIds.has(item.id))) &&
      inPeriod(item.createdAt, search.period)
  );

  const waiting = items.filter((item) => item.status === 'waiting').length;

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title={access.role === 'admin' ? '질문 관리' : '내 질문함'}
        description='배정된 질문과 공유된 근거를 확인하고 답변합니다.'
        action={
          <Typography.Text type='secondary'>
            {access.role === 'admin'
              ? '전체 운영 범위'
              : `배정 자료 ${access.materialIds.length}개`}
          </Typography.Text>
        }
      />
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      {reviews.error && (
        <QueryError
          error={reviews.error}
          retry={() => reviews.refetch()}
        />
      )}
      <div className='grid grid-cols-4 gap-5'>
        {[
          ['검색된 전체 질문', query.data?.total],
          ['현재 목록 · 답변 대기', query.data ? waiting : undefined],
          [
            '미처리 검토 요청',
            reviews.data
              ? reviews.data.items.filter((item) => item.status === 'open')
                  .length
              : undefined,
          ],
          [
            '현재 목록 · 답변 완료',
            query.data ? items.length - waiting : undefined,
          ],
        ].map(([title, value]) => (
          <Card key={title}>
            <Statistic
              title={title}
              value={value}
              formatter={(shown) => (value === undefined ? '미확인' : shown)}
              loading={query.isPending || reviews.isPending}
            />
          </Card>
        ))}
      </div>
      <Tabs
        activeKey={search.status}
        onChange={(status) => change({ status, page: 1 })}
        items={[
          { key: 'all', label: '전체' },
          { key: 'waiting', label: `답변 대기 ${waiting}` },
          { key: 'review', label: '검토 요청' },
          { key: 'answered', label: `답변 완료 ${items.length - waiting}` },
        ]}
      />
      <ListFilters
        value={search}
        onChange={change}
        placeholder='질문 제목 또는 번호 검색'
      />
      <Table
        rowKey='id'
        dataSource={filtered}
        loading={query.isPending}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                search.q
                  ? '검색 조건에 맞는 질문이 없습니다.'
                  : '배정된 질문이 없습니다.'
              }
            />
          ),
        }}
        pagination={{
          current: search.page,
          pageSize: query.data?.limit ?? 20,
          total: query.data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => change({ page }),
        }}
        columns={[
          {
            title: '질문',
            key: 'title',
            width: '36%',
            render: (_, item) => (
              <Space
                orientation='vertical'
                size={0}>
                <Link
                  to='/questions/$questionId'
                  params={{ questionId: item.id }}>
                  #{item.id.slice(0, 8)} {item.title}
                </Link>
                <Typography.Text
                  type='secondary'
                  style={{ fontSize: 12 }}>
                  {item.author.name ?? '질문자'}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: '원문 근거',
            key: 'source',
            render: (_, item) => sourceLabel(item.source),
          },
          {
            title: '담당자',
            key: 'assignee',
            render: (_, item) =>
              item.assignee ? item.assignee.name || '이름 없음' : '미배정',
          },
          {
            title: '상태',
            dataIndex: 'status',
            render: (status) => <QuestionStatus status={status} />,
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
        title='질문 제목 검색과 페이지 이동은 전체 배정 질문에 적용합니다. 상태·기간 필터는 현재 페이지 안에서 적용합니다.'
        description='담당 언어와 배정 자료의 질문만 표시합니다. 학생 전체 학습 기록에는 접근할 수 없습니다.'
      />
    </section>
  );
}

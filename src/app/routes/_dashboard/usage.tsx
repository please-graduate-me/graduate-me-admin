import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Alert, Card, Empty, Statistic, Table, Tag, Typography } from 'antd';
import { usageQuery } from '@/domains/operations/api/operations';
import { formatDate } from '@/domains/questions/lib/format';
import { PageHeading } from './-components/PageHeading';
import { QueryError } from './-components/QueryError';
import { ListFilters } from './-components/ListFilters';
import {
  inPeriod,
  parseListSearch,
  tablePage,
  type ListSearch,
} from './-components/listSearch';

/** 저장된 처리 작업만 조회하고 비용 미수집 상태를 명시한다. */
export const Route = createFileRoute('/_dashboard/usage')({
  validateSearch: parseListSearch,
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/questions' });
  },
  component: Usage,
});

function Usage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(usageQuery);

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const allItems = query.data?.items ?? [];

  const items = allItems.filter(
    (item) =>
      (search.status === 'all' ||
        item.status.toLowerCase() === search.status) &&
      inPeriod(item.createdAt, search.period) &&
      `${item.id} ${item.title}`.toLowerCase().includes(search.q.toLowerCase())
  );

  const counts = [
    ['전체 작업', allItems.length],
    [
      '완료',
      allItems.filter((item) =>
        ['ready', 'completed', 'done'].includes(item.status.toLowerCase())
      ).length,
    ],
    [
      '실패',
      allItems.filter((item) => item.status.toLowerCase() === 'failed').length,
    ],
    [
      '진행 · 대기',
      allItems.filter((item) =>
        ['pending', 'processing', 'queued'].includes(item.status.toLowerCase())
      ).length,
    ],
  ] as const;

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='AI 사용량 · 처리 이력'
        description='최근 100개 영상 자료 준비 작업의 상태를 확인합니다.'
      />
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <div className='grid grid-cols-4 gap-5'>
        {counts.map(([title, value]) => (
          <Card key={title}>
            <Statistic
              title={title}
              value={query.data ? value : undefined}
              formatter={(shown) => (query.data ? shown : '미확인')}
              loading={query.isPending}
            />
          </Card>
        ))}
      </div>
      <ListFilters
        value={search}
        onChange={change}
        placeholder='작업 ID · 자료명 검색'
        statuses={[
          { value: 'pending', label: '대기 중' },
          { value: 'processing', label: '처리 중' },
          { value: 'completed', label: '완료' },
          { value: 'failed', label: '실패' },
        ]}
      />
      <Table
        rowKey='id'
        loading={query.isPending}
        dataSource={items}
        expandable={{
          expandedRowRender: (item) => (
            <Typography.Paragraph className='mb-0!'>
              {item.errorMessage || '기록된 오류가 없습니다.'} · 작업 시도{' '}
              {item.attempts}회
            </Typography.Paragraph>
          ),
          rowExpandable: (item) => Boolean(item.errorMessage),
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='기록된 처리 작업이 없습니다.'
            />
          ),
        }}
        pagination={{
          current: tablePage(search.page, items.length),
          pageSize: 20,
          total: items.length,
          showSizeChanger: false,
          onChange: (page) => change({ page }),
        }}
        columns={[
          {
            title: '작업',
            key: 'title',
            width: '36%',
            render: (_, item) => (
              <div>
                {item.title}
                <Typography.Paragraph
                  type='secondary'
                  className='mt-1! mb-0!'>
                  {item.id}
                </Typography.Paragraph>
              </div>
            ),
          },
          { title: '요청 유형', key: 'type', render: () => '영상 자료 준비' },
          {
            title: '상태',
            dataIndex: 'status',
            render: (status: string) => (
              <Tag
                bordered={false}
                color={status.toLowerCase() === 'failed' ? 'red' : 'blue'}>
                {(
                  {
                    ready: '완료',
                    completed: '완료',
                    done: '완료',
                    pending: '대기 중',
                    queued: '대기 중',
                    processing: '처리 중',
                    failed: '실패',
                  } as Record<string, string>
                )[status.toLowerCase()] || status}
              </Tag>
            ),
          },
          {
            title: '최근 업데이트',
            dataIndex: 'updatedAt',
            render: formatDate,
          },
          {
            title: '비용 정보',
            key: 'cost',
            render: () => (
              <Typography.Text type='secondary'>현재 미수집</Typography.Text>
            ),
          },
        ]}
      />
      <Alert
        type='info'
        title='비용·토큰 사용량은 현재 수집하지 않습니다. 요청 건수로 비용을 추정하지 않으며 API 키와 인증 비밀값을 표시하지 않습니다.'
      />
    </section>
  );
}

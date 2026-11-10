import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Empty, Statistic, Table, Tag, Typography } from 'antd';
import { usageQuery } from '@/domains/operations/api/operations';
import { formatDate } from '@/domains/questions/lib/format';
import { PageHeading } from '../../-components/PageHeading';
import { QueryError } from '../../-components/QueryError';
import { ListFilters } from '../../-components/ListFilters';
import { type ListSearch } from '../../-components/listSearch';

/** 영상 준비 큐 상태를 공급자별 AI 실행 기록과 별도 표시한다. */
export function ProcessingJobs({
  search,
  onChange,
}: {
  search: ListSearch;
  onChange: (patch: Partial<ListSearch>) => void;
}) {
  const query = useQuery(
    usageQuery({
      page: search.page,
      q: search.q,
      status: search.status,
      period: search.period,
    })
  );

  const change = onChange;
  const items = query.data?.items ?? [];
  const summary = query.data?.summary;

  const counts = [
    ['전체 작업', summary?.total],
    ['완료', summary?.completed],
    ['실패', summary?.failed],
    ['진행 · 대기', summary?.processing],
  ] as const;

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='영상 자료 준비 이력'
        description='검색·상태·기간 조건 전체의 작업 수를 집계하고 20개씩 표시합니다.'
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
          { value: 'queued', label: '대기 중' },
          { value: 'preparing', label: '자료 준비 중' },
          { value: 'transcribing', label: '전사 중' },
          { value: 'ready', label: '완료' },
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
          current: search.page,
          pageSize: 20,
          total: query.data?.total ?? 0,
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
                    preparing: '자료 준비 중',
                    transcribing: '전사 중',
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
              <Typography.Text type='secondary'>
                AI 실행 기록에서 확인
              </Typography.Text>
            ),
          },
        ]}
      />
      <Alert
        type='info'
        title='이 표는 영상 준비 큐의 상태를 표시합니다. 공급자가 반환한 토큰과 설정 단가 기반 추정 비용은 AI 실행 기록에서 확인합니다.'
      />
    </section>
  );
}

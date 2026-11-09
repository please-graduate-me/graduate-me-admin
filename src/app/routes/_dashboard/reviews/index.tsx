import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { Alert, Empty, Segmented, Table, Tag } from 'antd';
import { useState } from 'react';
import { reviewsQuery } from '@/domains/questions/api/questions';
import { formatDate, sourceLabel } from '@/domains/questions/lib/format';
import { PageHeading } from '../-components/PageHeading';
import { QueryError } from '../-components/QueryError';
import { ListFilters } from '../-components/ListFilters';
import {
  inPeriod,
  parseListSearch,
  tablePage,
  type ListSearch,
} from '../-components/listSearch';

/** 운영자에게 근거와 버전이 명시된 검토 요청 목록을 제공한다. */
export const Route = createFileRoute('/_dashboard/reviews/')({
  validateSearch: parseListSearch,
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/questions' });
  },
  component: Reviews,
});

function Reviews() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(reviewsQuery);
  const [kind, setKind] = useState<'all' | 'report' | 'review_request'>('all');

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const items = (query.data?.items ?? []).filter(
    (item) =>
      (kind === 'all' || item.kind === kind) &&
      (search.status === 'all' || item.status === search.status) &&
      inPeriod(item.createdAt, search.period) &&
      `${item.reason} ${item.source.title} ${item.version}`
        .toLowerCase()
        .includes(search.q.toLowerCase())
  );

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='신고 · 수정 요청'
        description='원문 근거와 변경 영향을 확인한 뒤 조치 사유를 기록합니다.'
      />
      <Segmented
        value={kind}
        onChange={(value) => setKind(value as typeof kind)}
        options={[
          { value: 'all', label: '전체' },
          { value: 'report', label: '학생 오류 신고' },
          { value: 'review_request', label: '도우미 수정 요청' },
        ]}
      />
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <ListFilters
        value={search}
        onChange={change}
        placeholder='요청 사유 · 자료명 검색'
        statuses={[
          { value: 'open', label: '검토 대기' },
          { value: 'resolved', label: '검토 완료' },
          { value: 'dismissed', label: '반려' },
        ]}
      />
      <Table
        rowKey='id'
        dataSource={items}
        loading={query.isPending}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='접수된 검토 요청이 없습니다.'
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
            title: '접수 종류',
            dataIndex: 'kind',
            render: (value) => (
              <Tag color={value === 'report' ? 'red' : 'blue'}>
                {value === 'report' ? '학생 오류 신고' : '도우미 수정 요청'}
              </Tag>
            ),
          },
          {
            title: '요청 사유',
            key: 'reason',
            width: '36%',
            render: (_, item) => (
              <Link
                to='/reviews/$reviewId'
                params={{ reviewId: item.id }}>
                {item.reason}
              </Link>
            ),
          },
          {
            title: '대상 / 버전',
            key: 'source',
            render: (_, item) =>
              `${sourceLabel(item.source)} · ${item.version}`,
          },
          {
            title: '요청자',
            key: 'author',
            render: (_, item) => item.author.name || '이름 없음',
          },
          {
            title: '상태',
            dataIndex: 'status',
            render: (value) => (
              <Tag
                bordered={false}
                color={
                  value === 'open'
                    ? 'orange'
                    : value === 'resolved'
                      ? 'green'
                      : undefined
                }>
                {value === 'open'
                  ? '검토 대기'
                  : value === 'resolved'
                    ? '검토 완료'
                    : '반려'}
              </Tag>
            ),
          },
          { title: '접수', dataIndex: 'createdAt', render: formatDate },
        ]}
      />
      <Alert
        type='info'
        title='신고·수정 요청에서 공유된 원문과 결과를 열어 실제 버전 수정, 범위별 검토, 문제 노출 조치를 수행할 수 있습니다. 과거 답안의 정답과 근거는 보존됩니다.'
      />
    </section>
  );
}

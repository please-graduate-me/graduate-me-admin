import { RouterLink as Link } from '@/components/ui/RouterLink';
import { SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { SegmentedControl } from '@astryxdesign/core/SegmentedControl';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { DataTable } from '@/components/ui/DataTable';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import type { SearchSchemaInput } from '@tanstack/react-router';
import { reviewListQuery } from '@/domains/questions/api/questions';
import { formatDate, sourceLabel } from '@/domains/questions/lib/format';
import { PageHeading } from '../-components/PageHeading';
import { QueryError } from '../-components/QueryError';
import { ListFilters } from '../-components/ListFilters';
import { parseListSearch, type ListSearch } from '../-components/listSearch';

/** 운영자에게 근거와 버전이 명시된 검토 요청 목록을 제공한다. */
export const Route = createFileRoute('/_dashboard/reviews/')({
  validateSearch: (
    raw: Partial<ListSearch> & {
      kind?: string;
    } & SearchSchemaInput
  ) => ({
    ...parseListSearch(raw),
    kind:
      raw.kind === 'report' || raw.kind === 'review_request' ? raw.kind : 'all',
  }),
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/questions' });
  },
  component: Reviews,
});

function Reviews() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(reviewListQuery(search));

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const items = query.data?.items ?? [];

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='신고 · 수정 요청'
        description='원문 근거와 변경 영향을 확인한 뒤 조치 사유를 기록합니다.'
      />
      <SegmentedControl
        value={search.kind}
        onChange={(kind) =>
          void navigate({
            search: (previous) => ({
              ...previous,
              kind: String(kind),
              page: 1,
            }),
            replace: true,
          })
        }
        label='표시 조건'>
        {[
          { value: 'all', label: '전체' },
          { value: 'report', label: '학생 오류 신고' },
          { value: 'review_request', label: '도우미 수정 요청' },
        ].map((item) => (
          <SegmentedControlItem
            key={item.value}
            value={item.value}
            label={item.label}
          />
        ))}
      </SegmentedControl>
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
      <DataTable
        rowKey='id'
        dataSource={items}
        loading={query.isPending}
        locale={{
          emptyText: <EmptyState title='접수된 검토 요청이 없습니다.' />,
        }}
        pagination={{
          mode: 'server',
          current: search.page,
          pageSize: 20,
          total: query.data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => change({ page }),
        }}
        columns={[
          {
            title: '접수 종류',
            dataIndex: 'kind',
            render: (value) => (
              <Badge
                variant={value === 'report' ? 'red' : 'blue'}
                label={
                  <>
                    {value === 'report' ? '학생 오류 신고' : '도우미 수정 요청'}
                  </>
                }
              />
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
              <Badge
                variant={
                  value === 'open'
                    ? 'orange'
                    : value === 'resolved'
                      ? 'green'
                      : undefined
                }
                label={
                  <>
                    {value === 'open'
                      ? '검토 대기'
                      : value === 'resolved'
                        ? '검토 완료'
                        : '반려'}
                  </>
                }
              />
            ),
          },
          { title: '접수', dataIndex: 'createdAt', render: formatDate },
        ]}
      />
      <Banner
        status='info'
        title='신고·수정 요청에서 공유된 원문과 결과를 열어 실제 버전 수정, 범위별 검토, 문제 노출 조치를 수행할 수 있습니다. 과거 답안의 정답과 근거는 보존됩니다.'
      />
    </section>
  );
}

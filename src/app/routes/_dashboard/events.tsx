import { RouterLink as Link } from '@/components/ui/RouterLink';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { Card } from '@astryxdesign/core/Card';
import { DataTable } from '@/components/ui/DataTable';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { eventListQuery } from '@/domains/questions/api/questions';
import { eventLabels } from '@/domains/questions/config/events';
import { formatDate } from '@/domains/questions/lib/format';
import { PageHeading } from './-components/PageHeading';
import { QueryError } from './-components/QueryError';
import { ListFilters } from './-components/ListFilters';
import { parseListSearch, type ListSearch } from './-components/listSearch';

/** admin 내부 이력을 학생의 공개 대화와 별도 경로에서 조회한다. */
export const Route = createFileRoute('/_dashboard/events')({
  validateSearch: parseListSearch,
  beforeLoad: ({ context }) => {
    if (!context.access.role) throw redirect({ to: '/courses' });
  },
  component: Events,
});

function Events() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(eventListQuery(search));

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const items = query.data?.items ?? [];

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='검토 · 변경 이력'
        description='배정 자료의 검토와 변경 내역을 확인합니다.'
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
        placeholder='질문 번호 · 작업자 검색'
        statuses={[
          { value: 'public', label: '학생에게 공개' },
          { value: 'internal', label: 'admin 내부' },
        ]}
      />
      <DataTable
        rowKey='id'
        loading={query.isPending}
        dataSource={items}
        locale={{
          emptyText: <EmptyState title='조회할 검토 · 변경 이력이 없습니다.' />,
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
            title: '검토 · 변경 내역',
            key: 'action',
            width: '36%',
            render: (_, item) => (
              <div>
                {item.questionId ? (
                  <Link
                    to='/questions/$questionId'
                    params={{ questionId: item.questionId }}>
                    {eventLabels[item.action] || '운영 기록'}
                  </Link>
                ) : (
                  eventLabels[item.action] || '운영 기록'
                )}
                <Text
                  className='mt-1! mb-0!'
                  as='p'
                  color='secondary'>
                  {item.detail}
                </Text>
              </div>
            ),
          },
          {
            title: '질문',
            dataIndex: 'questionId',
            render: (id) => (id ? `#${id.slice(0, 8)}` : '공통 운영'),
          },
          {
            title: '작업자',
            key: 'actor',
            render: (_, item) => item.actor.name || '이름 없음',
          },
          {
            title: '공개 범위',
            dataIndex: 'visibility',
            render: (value) => (
              <Badge
                variant={value === 'public' ? 'blue' : undefined}
                label={
                  <>{value === 'public' ? '학생에게 공개' : 'admin 내부'}</>
                }
              />
            ),
          },
          { title: '일시', dataIndex: 'createdAt', render: formatDate },
        ]}
      />
      <Banner
        status='info'
        title='내부 메모와 업무 배정·운영 기록은 admin에서만 조회합니다. 학생은 게시된 답변과 공개된 수정 결과만 확인합니다.'
      />
      <Card padding={5}>
        <Heading level={3}>{'검토 범위와 과거 기록'}</Heading>
        <Text
          className='mb-0!'
          as='p'>
          수정 대상은 구절·설명·문제와 버전으로 구분합니다. 검토 요청에 대한
          조치 기록이 원문이나 생성 문제의 변경을 의미하지는 않습니다.
        </Text>
      </Card>
    </section>
  );
}

import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Alert, Card, Empty, Table, Tag, Typography } from 'antd';
import { eventsQuery } from '@/domains/questions/api/questions';
import { eventLabels } from '@/domains/questions/config/events';
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

/** admin 내부 이력을 학생의 공개 대화와 별도 경로에서 조회한다. */
export const Route = createFileRoute('/_dashboard/events')({
  validateSearch: parseListSearch,
  component: Events,
});

function Events() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(eventsQuery);

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const items = (query.data?.items ?? []).filter(
    (item) =>
      inPeriod(item.createdAt, search.period) &&
      (search.status === 'all' || item.visibility === search.status) &&
      `${item.questionId ?? ''} ${item.action} ${item.detail} ${item.actor.name ?? ''}`
        .toLowerCase()
        .includes(search.q.toLowerCase())
  );

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
      <Table
        rowKey='id'
        loading={query.isPending}
        dataSource={items}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='조회할 검토 · 변경 이력이 없습니다.'
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
                <Typography.Paragraph
                  type='secondary'
                  className='mt-1! mb-0!'>
                  {item.detail}
                </Typography.Paragraph>
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
              <Tag
                bordered={false}
                color={value === 'public' ? 'blue' : undefined}>
                {value === 'public' ? '학생에게 공개' : 'admin 내부'}
              </Tag>
            ),
          },
          { title: '일시', dataIndex: 'createdAt', render: formatDate },
        ]}
      />
      <Alert
        type='info'
        title='내부 메모와 업무 배정·운영 기록은 admin에서만 조회합니다. 학생은 게시된 답변과 공개된 수정 결과만 확인합니다.'
      />
      <Card title='검토 범위와 과거 기록'>
        <Typography.Paragraph className='mb-0!'>
          수정 대상은 구절·설명·문제와 버전으로 구분합니다. 검토 요청에 대한
          조치 기록이 원문이나 생성 문제의 변경을 의미하지는 않습니다.
        </Typography.Paragraph>
      </Card>
    </section>
  );
}

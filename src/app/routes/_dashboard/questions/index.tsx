import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Space,
  Statistic,
  Table,
  Tabs,
  Typography,
} from 'antd';
import { questionsQuery } from '@/domains/questions/api/questions';
import { formatDate, sourceLabel } from '@/domains/questions/lib/format';
import { QuestionStatus } from '@/domains/questions/ui/QuestionStatus';
import { PageHeading } from '../-components/PageHeading';
import { QueryError } from '../-components/QueryError';
import { ListFilters } from '../-components/ListFilters';
import { parseListSearch, type ListSearch } from '../-components/listSearch';

/** 배정 질문 목록과 URL 기반 상태·검색 조건을 연결한다. */
export const Route = createFileRoute('/_dashboard/questions/')({
  validateSearch: parseListSearch,
  beforeLoad: ({ context }) => {
    if (!context.access.role) throw redirect({ to: '/courses' });
  },
  component: Questions,
});

function Questions() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const query = useQuery(
    questionsQuery(search.page, search.q, search.status, search.period)
  );

  const { access } = Route.useRouteContext();
  const { modal } = App.useApp();
  const items = query.data?.items ?? [];

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const summary = query.data?.summary;
  const waiting = summary?.waiting ?? 0;

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title={access.role === 'admin' ? '질문 관리' : '내 질문함'}
        description='배정된 질문과 공유된 근거를 확인하고 답변합니다.'
        action={
          <Button
            onClick={() =>
              modal.info({
                title: '현재 담당 범위',
                content: (
                  <Descriptions
                    column={1}
                    className='mt-4!'
                    items={[
                      {
                        key: 'role',
                        label: '역할',
                        children:
                          access.role === 'admin'
                            ? '운영 관리자 · 전체 운영 범위'
                            : '학과 답변 도우미',
                      },
                      {
                        key: 'languages',
                        label: '담당 언어',
                        children:
                          access.languages
                            .map((language) =>
                              language === 'en'
                                ? '영어'
                                : language === 'th'
                                  ? '태국어'
                                  : language
                            )
                            .join(', ') || '미지정',
                      },
                      {
                        key: 'materials',
                        label: '배정 자료',
                        children:
                          access.role === 'admin'
                            ? '운영 권한 범위'
                            : `${access.materialIds.length}개 · 본인에게 배정된 질문만 접근`,
                      },
                      {
                        key: 'permissions',
                        label: '수행 권한',
                        children: [
                          '답변',
                          ...(access.canReview ? ['검토'] : []),
                          ...(access.canRequestEdit ? ['수정 요청'] : []),
                          ...(access.canEdit ? ['직접 수정'] : []),
                        ].join(' · '),
                      },
                    ]}
                  />
                ),
              })
            }>
            배정 범위 확인
          </Button>
        }
      />
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <div className='grid grid-cols-4 gap-5'>
        {[
          ['검색된 전체 질문', summary?.all],
          ['답변 대기', summary?.waiting],
          ['미처리 검토 요청 질문', summary?.review],
          ['답변 완료', summary?.answered],
        ].map(([title, value]) => (
          <Card key={title}>
            <Statistic
              title={title}
              value={value}
              formatter={(shown) => (value === undefined ? '미확인' : shown)}
              loading={query.isPending}
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
          { key: 'review', label: `검토 요청 ${summary?.review ?? 0}` },
          { key: 'answered', label: `답변 완료 ${summary?.answered ?? 0}` },
        ]}
      />
      <ListFilters
        value={search}
        onChange={change}
        placeholder='질문 제목 또는 번호 검색'
      />
      <Table
        rowKey='id'
        dataSource={items}
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
        title='검색·상태·기간 조건과 집계는 접근 가능한 전체 질문에 적용합니다.'
        description='담당 언어와 배정 자료의 질문만 표시합니다. 학생 전체 학습 기록에는 접근할 수 없습니다.'
      />
    </section>
  );
}

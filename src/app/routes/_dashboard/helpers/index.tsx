import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Alert, Button, Empty, Space, Table, Tag, Typography } from 'antd';
import {
  helpersQuery,
  materialsQuery,
} from '@/domains/operations/api/operations';
import type { Helper } from '@/domains/operations/model/contracts';
import { PageHeading } from '../-components/PageHeading';
import { QueryError } from '../-components/QueryError';
import { ListFilters } from '../-components/ListFilters';
import {
  parseListSearch,
  tablePage,
  type ListSearch,
} from '../-components/listSearch';
import { HelperEditor } from './-components/HelperEditor';

/** 운영자가 도우미 역할과 자료별 수행 권한을 별도로 관리한다. */
export const Route = createFileRoute('/_dashboard/helpers/')({
  validateSearch: parseListSearch,
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/questions' });
  },
  component: Helpers,
});

function Helpers() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(helpersQuery);
  const materials = useQuery(materialsQuery);
  const [editing, setEditing] = useState<Helper | null | undefined>(undefined);

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const items = (query.data?.items ?? []).filter(
    (item) =>
      (search.status === 'all' ||
        (search.status === 'active') === item.active) &&
      `${item.name ?? ''} ${item.email} ${item.languages.map((l) => (l === 'en' ? '영어' : '태국어')).join(' ')}`
        .toLowerCase()
        .includes(search.q.toLowerCase())
  );

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='도우미 · 권한'
        description='담당 언어와 배정 자료, 수행 권한을 관리합니다.'
        action={
          <Button
            type='primary'
            onClick={() => setEditing(null)}>
            도우미 등록
          </Button>
        }
      />
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <ListFilters
        showPeriod={false}
        value={search}
        onChange={change}
        placeholder='이름 · 이메일 · 담당 언어 검색'
        statuses={[
          { value: 'active', label: '활성' },
          { value: 'inactive', label: '비활성' },
        ]}
      />
      <Table
        rowKey='userId'
        dataSource={items}
        loading={query.isPending}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='등록된 학과 답변 도우미가 없습니다.'
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
            title: '이름 · 계정',
            key: 'name',
            width: '30%',
            render: (_, item) => (
              <Space
                orientation='vertical'
                size={0}>
                <Typography.Text strong>
                  {item.name || '이름 없음'}
                </Typography.Text>
                <Typography.Text type='secondary'>{item.email}</Typography.Text>
              </Space>
            ),
          },
          {
            title: '담당 언어',
            key: 'languages',
            render: (_, item) =>
              item.languages
                .map((l) => (l === 'en' ? '영어' : '태국어'))
                .join(', ') || '미지정',
          },
          {
            title: '배정 자료',
            key: 'materialIds',
            render: (_, item) => `${item.materialIds.length}개`,
          },
          {
            title: '권한',
            key: 'permissions',
            render: (_, item) => (
              <Space wrap>
                <Tag>답변</Tag>
                {item.canReview && <Tag>검토</Tag>}
                {item.canRequestEdit && <Tag>수정 요청</Tag>}
              </Space>
            ),
          },
          {
            title: '상태',
            dataIndex: 'active',
            render: (active) => (
              <Tag
                color={active ? 'green' : undefined}
                bordered={false}>
                {active ? '활성' : '비활성'}
              </Tag>
            ),
          },
          {
            title: '관리',
            key: 'edit',
            render: (_, item) => (
              <Button onClick={() => setEditing(item)}>배정 · 권한 편집</Button>
            ),
          },
        ]}
      />
      <Alert
        type='info'
        title='도우미는 admin에서 진입합니다. 담당 언어와 자료가 모두 일치하고 본인에게 배정된 질문만 접근할 수 있습니다.'
        description='배정 자료가 없으면 질문에 접근할 수 없습니다. 운영 관리자는 계정 환경 설정으로 별도 부여하며 이 폼에서 생성하지 않습니다.'
      />
      {editing !== undefined && (
        <HelperEditor
          key={editing?.userId || 'new'}
          helper={editing}
          materials={materials.data?.items ?? []}
          materialsLoading={materials.isPending}
          materialsError={materials.error}
          onClose={() => setEditing(undefined)}
        />
      )}
    </section>
  );
}

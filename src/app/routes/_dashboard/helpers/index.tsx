import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Alert, Button, Empty, Space, Table, Tag, Typography } from 'antd';
import { helpersQuery } from '@/domains/operations/api/operations';
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
  const [editing, setEditing] = useState<Helper | null | undefined>(undefined);

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const items = (query.data?.items ?? []).filter(
    (item) =>
      (search.status === 'all' ||
        (search.status === 'active') === item.active) &&
      `${item.name ?? ''} ${item.email}`
        .toLowerCase()
        .includes(search.q.toLowerCase())
  );

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='조교 자격'
        description='프로필의 조교 타이틀과 커뮤니티 태그 모아보기를 관리합니다.'
        action={
          <Button
            type='primary'
            onClick={() => setEditing(null)}>
            조교 등록
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
        placeholder='이름 · 이메일 검색'
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
              description='등록된 조교가 없습니다.'
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
              <Button onClick={() => setEditing(item)}>자격 편집</Button>
            ),
          },
        ]}
      />
      <Alert
        type='info'
        title='조교는 일반 사용자와 같은 서비스 웹을 사용합니다.'
        description='조교 자격으로 운영 콘솔이나 다른 사용자의 개인 기록에 접근할 수 없습니다.'
      />
      {editing !== undefined && (
        <HelperEditor
          key={editing?.userId || 'new'}
          helper={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </section>
  );
}

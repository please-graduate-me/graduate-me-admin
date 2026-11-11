import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Card, Empty, Table, Tag, Typography } from 'antd';
import { materialListQuery } from '@/domains/operations/api/operations';
import { formatDate } from '@/domains/questions/lib/format';
import { QueryError } from '../QueryError';

/** 전체 자료 건수와 최근 등록 자료를 같은 기간 조건으로 보여준다. */
export function OverviewMaterials({ period }: { period: 'all' | '7' | '30' }) {
  const query = useQuery(
    materialListQuery({ page: 1, q: '', status: 'all', period })
  );

  return (
    <Card
      title='최근 등록 자료'
      extra={
        <Link
          to='/materials'
          search={{ period }}>
          자료 관리
        </Link>
      }>
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <Typography.Paragraph type='secondary'>
        선택 기간에 등록된 자료{' '}
        {query.data?.total.toLocaleString('ko-KR') ?? '미확인'}개 중 최근 5개
      </Typography.Paragraph>
      <Table
        rowKey={(item) => `${item.kind}-${item.id}`}
        size='small'
        pagination={false}
        loading={query.isPending}
        dataSource={query.data?.items.slice(0, 5) ?? []}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                query.error
                  ? '자료를 조회하지 못했습니다.'
                  : '등록된 자료가 없습니다.'
              }
            />
          ),
        }}
        columns={[
          { title: '자료', dataIndex: 'title', ellipsis: true },
          {
            title: '종류',
            dataIndex: 'kind',
            width: 80,
            render: (kind) => (kind === 'pdf' ? 'PDF' : '영상'),
          },
          {
            title: '공개 범위',
            dataIndex: 'visibility',
            width: 100,
            render: (visibility: 'public' | 'private' | 'accounts') => (
              <Tag>
                {
                  { public: '공용', private: '비공개', accounts: '지정 계정' }[
                    visibility
                  ]
                }
              </Tag>
            ),
          },
          {
            title: '등록일',
            dataIndex: 'createdAt',
            render: formatDate,
            width: 170,
          },
        ]}
      />
    </Card>
  );
}

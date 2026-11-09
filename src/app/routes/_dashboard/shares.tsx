import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Input,
  Popconfirm,
  Space,
  Statistic,
  Table,
  Tag,
} from 'antd';
import { sharesQuery, useRevokeShare } from '@/domains/shares/api/shares';
import { formatDate, formatTime } from '@/domains/questions/lib/format';
import { PageHeading } from './-components/PageHeading';
import { QueryError } from './-components/QueryError';
import { parseListSearch } from './-components/listSearch';

/** 기존 공유 운영 기능을 학생 앱 대신 admin에서 제공한다. */
export const Route = createFileRoute('/_dashboard/shares')({
  validateSearch: parseListSearch,
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/questions' });
  },
  component: Shares,
});

function Shares() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(sharesQuery(search.page, search.q));
  const revoke = useRevokeShare();
  const { message } = App.useApp();

  async function stop(id: string) {
    try {
      await revoke.mutateAsync(id);
      message.success('공유 링크를 중지했습니다.');
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  }

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='공유 링크'
        description='공유 링크의 유입과 학습 시작을 확인하고 필요한 링크를 중지합니다.'
      />
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <div className='grid grid-cols-3 gap-5'>
        {[
          ['전체 공유 링크', query.data?.summary.links],
          ['로그인 방문 세션', query.data?.summary.visits],
          ['링크별 학습 시작', query.data?.summary.starts],
        ].map(([title, value]) => (
          <Card key={title}>
            <Statistic
              title={title}
              value={value}
              formatter={(shown) => (query.data ? shown : '미확인')}
              loading={query.isPending}
            />
          </Card>
        ))}
      </div>
      <Input.Search
        className='w-96!'
        value={search.q}
        maxLength={100}
        onChange={(event) =>
          void navigate({
            search: (prev) => ({ ...prev, q: event.target.value, page: 1 }),
            replace: true,
          })
        }
        placeholder='영상 제목 또는 공유자 이메일'
        aria-label='영상 제목 또는 공유자 이메일'
        allowClear
      />
      <Table
        rowKey='id'
        dataSource={query.data?.items ?? []}
        loading={query.isPending}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='조회할 공유 링크가 없습니다.'
            />
          ),
        }}
        columns={[
          {
            title: '영상',
            key: 'video',
            render: (_, item) => item.video.title,
          },
          {
            title: '공유자',
            key: 'creator',
            render: (_, item) =>
              item.creator?.name || item.creator?.email || '계정 정보 없음',
          },
          {
            title: '구간',
            key: 'segment',
            render: (_, item) =>
              item.segment
                ? `${formatTime(item.segment.start)} ~ ${formatTime(item.segment.end)}`
                : '전체 영상',
          },
          { title: '방문', dataIndex: 'visitCount' },
          { title: '학습 시작', dataIndex: 'startCount' },
          { title: '생성일', dataIndex: 'createdAt', render: formatDate },
          {
            title: '상태',
            key: 'status',
            render: (_, item) =>
              item.revokedAt ? (
                <Tag>중지됨</Tag>
              ) : (
                <Popconfirm
                  title='이 공유 링크를 중지할까요?'
                  description='기존 통계는 유지되고 링크 접근은 중지됩니다.'
                  okText='공유 중지'
                  cancelText='취소'
                  onConfirm={() => stop(item.id)}>
                  <Button
                    danger
                    loading={revoke.isPending}>
                    공유 중지
                  </Button>
                </Popconfirm>
              ),
          },
        ]}
      />
      <Space>
        <Button
          disabled={search.page <= 1 || query.isPending}
          onClick={() =>
            void navigate({
              search: (prev) => ({ ...prev, page: prev.page - 1 }),
            })
          }>
          이전
        </Button>
        <span>{search.page} 페이지</span>
        <Button
          disabled={!query.data?.hasMore || query.isPending}
          onClick={() =>
            void navigate({
              search: (prev) => ({ ...prev, page: prev.page + 1 }),
            })
          }>
          다음
        </Button>
      </Space>
      <Alert
        type='info'
        title='로그인 방문 세션과 링크별 학습 시작 사용자 수를 집계합니다. 실제 사람 수나 청취 시간을 뜻하지 않습니다.'
      />
    </section>
  );
}

import { Link } from '@tanstack/react-router';
import { Alert, Card, Empty, Table, Tag } from 'antd';
import { formatDate } from '@/domains/questions/lib/format';
import type { OverviewTask } from './buildOverviewTasks';

const labels = {
  community: '게시물 신고',
  review: '검토 요청',
  question: '미답변 기록',
  failed: '처리 실패',
};

/** 업무별 상세 경로에 현재 기간과 처리 조건을 전달한다. */
export function OverviewTasks({
  tasks,
  loading,
  incomplete,
  period,
}: {
  tasks: OverviewTask[];
  loading: boolean;
  incomplete: boolean;
  period: 'all' | '7' | '30';
}) {
  return (
    <Card title='확인할 업무'>
      <Alert
        className='mb-4!'
        type={incomplete ? 'warning' : 'info'}
        showIcon
        title={
          incomplete
            ? '일부 업무를 불러오지 못했습니다. 표시된 목록이 전체가 아닐 수 있습니다.'
            : '실패 → 게시물 신고 → 검토 요청 → 미답변 기록 순으로 표시합니다.'
        }
        description='선택 기간에 생성된 미처리 기록을 종류별 최근 20개까지 모았습니다. 전체 건수는 상단 카드에서, 전체 목록은 각 관리 화면에서 확인할 수 있습니다.'
      />
      <Table
        rowKey='id'
        dataSource={tasks}
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{
          pageSize: 8,
          showSizeChanger: false,
          hideOnSinglePage: true,
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                incomplete
                  ? '조회하지 못한 업무가 있습니다.'
                  : '현재 조건에서 확인할 업무가 없습니다.'
              }
            />
          ),
        }}
        columns={[
          {
            title: '종류',
            dataIndex: 'kind',
            width: 130,
            render: (kind: OverviewTask['kind']) => (
              <Tag color={kind === 'failed' ? 'red' : 'orange'}>
                {labels[kind]}
              </Tag>
            ),
          },
          {
            title: '업무',
            key: 'title',
            width: '32%',
            render: (_, task) => {
              if (task.kind === 'review')
                return (
                  <Link
                    to='/reviews/$reviewId'
                    params={{ reviewId: task.sourceId }}>
                    {task.title}
                  </Link>
                );
              if (task.kind === 'question')
                return (
                  <Link
                    to='/questions/$questionId'
                    params={{ questionId: task.sourceId }}>
                    {task.title}
                  </Link>
                );
              if (task.kind === 'failed')
                return (
                  <Link
                    to='/usage'
                    search={{
                      view: 'jobs',
                      status: 'failed',
                      period,
                      q: task.sourceId,
                    }}>
                    {task.title}
                  </Link>
                );

              return (
                <Link
                  to='/moderation'
                  search={{ status: 'open', period, q: task.target }}>
                  {task.title}
                </Link>
              );
            },
          },
          { title: '대상', dataIndex: 'target', ellipsis: true },
          { title: '관련 계정', dataIndex: 'actor', width: 130 },
          {
            title: '최근 변경',
            dataIndex: 'updatedAt',
            render: formatDate,
            width: 170,
          },
        ]}
      />
    </Card>
  );
}

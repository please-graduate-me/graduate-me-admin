import { Text } from '@astryxdesign/core/Text';
import { useImperativeAlertDialog } from '@astryxdesign/core/AlertDialog';
import { useToast } from '@astryxdesign/core/Toast';
import { Card } from '@astryxdesign/core/Card';
import { TextInput } from '@astryxdesign/core/TextInput';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Banner } from '@astryxdesign/core/Banner';
import { Metric } from '@/components/ui/Metric';
import { DataTable } from '@/components/ui/DataTable';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
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
  const toast = useToast();
  const confirm = useImperativeAlertDialog();

  async function stop(id: string) {
    try {
      await revoke.mutateAsync(id);

      toast({
        type: 'info',
        body: '공유 링크를 중지했습니다.',
      });
    } catch (error) {
      if (error instanceof Error)
        toast({
          type: 'error',
          body: error.message,
        });
    }
  }

  return (
    <section className='flex flex-col gap-5'>
      {confirm.element}
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
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-3'>
        {[
          ['전체 공유 링크', query.data?.summary.links],
          ['로그인 방문 세션', query.data?.summary.visits],
          ['링크별 학습 시작', query.data?.summary.starts],
        ].map(([title, value]) => (
          <Card
            key={title}
            padding={5}>
            <Metric
              title={title}
              value={value}
              formatter={(shown) => (query.data ? shown : '미확인')}
              loading={query.isPending}
            />
          </Card>
        ))}
      </div>
      <TextInput
        containerClassName='w-96!'
        value={search.q}
        placeholder='영상 제목 또는 공유자 이메일'
        aria-label='영상 제목 또는 공유자 이메일'
        hasClear
        label={'영상 제목 또는 공유자 이메일'}
        isLabelHidden
        type='search'
        onChange={(event) =>
          void navigate({
            search: (prev) => ({ ...prev, q: event.slice(0, 100), page: 1 }),
            replace: true,
          })
        }
      />
      <DataTable
        rowKey='id'
        dataSource={query.data?.items ?? []}
        loading={query.isPending}
        pagination={false}
        locale={{
          emptyText: <EmptyState title='조회할 공유 링크가 없습니다.' />,
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
                <Badge label={<>중지됨</>} />
              ) : (
                <Button
                  label='공유 중지'
                  variant='destructive'
                  isLoading={revoke.isPending}
                  onClick={() =>
                    confirm.show({
                      title: '이 공유 링크를 중지할까요?',
                      description:
                        '기존 통계는 유지되고 링크 접근은 중지됩니다.',
                      actionLabel: '공유 중지',
                      cancelLabel: '취소',
                      onAction: async () => {
                        await stop(item.id);
                        confirm.hide();
                      },
                    })
                  }
                />
              ),
          },
        ]}
      />
      <Stack
        direction='horizontal'
        gap={2}>
        <Button
          isDisabled={search.page <= 1 || query.isPending}
          onClick={() =>
            void navigate({
              search: (prev) => ({ ...prev, page: prev.page - 1 }),
            })
          }
          variant='secondary'
          label='이전'
        />
        <Text>{search.page} 페이지</Text>
        <Button
          isDisabled={!query.data?.hasMore || query.isPending}
          onClick={() =>
            void navigate({
              search: (prev) => ({ ...prev, page: prev.page + 1 }),
            })
          }
          variant='secondary'
          label='다음'
        />
      </Stack>
      <Banner
        status='info'
        title='로그인 방문 세션과 링크별 학습 시작 사용자 수를 집계합니다. 실제 사람 수나 청취 시간을 뜻하지 않습니다.'
      />
    </section>
  );
}

import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { DataTable } from '@/components/ui/DataTable';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { communityReportsQuery } from '@/domains/operations/api/moderation';
import type { CommunityReport } from '@/domains/operations/model/moderation';
import { formatDate } from '@/domains/questions/lib/format';
import { PageHeading } from '../-components/PageHeading';
import { QueryError } from '../-components/QueryError';
import { ListFilters } from '../-components/ListFilters';
import { parseListSearch, type ListSearch } from '../-components/listSearch';
import { CommunityReportEditor } from './-components/CommunityReportEditor';

/** 일반 게시물 신고를 원문·AI 결과 오류와 구분해 운영한다. */
export const Route = createFileRoute('/_dashboard/moderation/')({
  validateSearch: parseListSearch,
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/courses' });
  },
  component: Moderation,
});

function Moderation() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(communityReportsQuery(search));
  const [selected, setSelected] = useState<CommunityReport | null>(null);

  const change = (patch: Partial<ListSearch>) =>
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
    });

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='게시물 신고'
        description='일반 커뮤니티의 게시 내용과 신고 사유를 확인하고 노출을 관리합니다.'
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
        placeholder='게시물 제목 · 신고 사유 검색'
        statuses={[
          { value: 'open', label: '접수' },
          { value: 'resolved', label: '조치 완료' },
          { value: 'dismissed', label: '반려' },
        ]}
      />
      <DataTable
        rowKey='id'
        loading={query.isPending}
        dataSource={query.data?.items ?? []}
        locale={{ emptyText: '접수된 게시물 신고가 없습니다.' }}
        pagination={{
          current: search.page,
          pageSize: 20,
          total: query.data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => change({ page }),
        }}
        columns={[
          {
            title: '신고 게시물',
            render: (_, item) => (
              <Button
                onClick={() => setSelected(item)}
                variant='ghost'
                label={item.post.title}
              />
            ),
          },
          { title: '신고 사유', dataIndex: 'reason', ellipsis: true },
          {
            title: '신고자',
            render: (_, item) => item.reporter.name || '이름 없음',
          },
          {
            title: '처리 상태',
            dataIndex: 'status',
            render: (status) => (
              <Badge
                variant={
                  status === 'open'
                    ? 'orange'
                    : status === 'resolved'
                      ? 'green'
                      : undefined
                }
                label={
                  <>
                    {status === 'open'
                      ? '접수'
                      : status === 'resolved'
                        ? '조치 완료'
                        : '반려'}
                  </>
                }
              />
            ),
          },
          {
            title: '게시물 노출',
            render: (_, item) => (
              <Badge
                variant={item.post.hiddenAt ? 'red' : undefined}
                label={
                  <>{item.post.hiddenAt ? '숨김' : '기존 공개 범위 유지'}</>
                }
              />
            ),
          },
          { title: '접수일', dataIndex: 'createdAt', render: formatDate },
        ]}
      />
      <Banner
        status='info'
        title='학습 자료·AI 설명·문제 오류는 신고 · 수정 요청 메뉴에서 처리합니다.'
        description='게시물 신고 조치는 원본 자료의 공개 권한과 개인 학습 기록을 바꾸지 않습니다.'
      />
      {selected && (
        <CommunityReportEditor
          report={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

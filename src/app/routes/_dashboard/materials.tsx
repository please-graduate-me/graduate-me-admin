import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  Alert,
  Button,
  Card,
  Empty,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { MaterialRegistration } from './materials/-components/MaterialRegistration';
import { MaterialAccessEditor } from './materials/-components/MaterialAccessEditor';
import { MaterialOcrPanel } from './materials/-components/MaterialOcrPanel';
import type { AdminMaterial } from '@/domains/operations/model/contracts';
import { materialsQuery } from '@/domains/operations/api/operations';
import { formatDate, formatTime } from '@/domains/questions/lib/format';
import { PageHeading } from './-components/PageHeading';
import { QueryError } from './-components/QueryError';
import { ListFilters } from './-components/ListFilters';
import {
  inPeriod,
  parseListSearch,
  tablePage,
  type ListSearch,
} from './-components/listSearch';

/** 운영자에게 자료 처리 상태와 최소 소유 정보만 표시한다. */
export const Route = createFileRoute('/_dashboard/materials')({
  validateSearch: parseListSearch,
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/questions' });
  },
  component: Materials,
});

function Materials() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = useQuery(materialsQuery);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMaterial | null>(null);
  const [recognizing, setRecognizing] = useState<AdminMaterial | null>(null);
  const { access } = Route.useRouteContext();

  const change = (patch: Partial<ListSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const items = (query.data?.items ?? []).filter(
    (item) =>
      (search.status === 'all' || item.kind === search.status) &&
      inPeriod(item.createdAt, search.period) &&
      `${item.title} ${item.owner?.name ?? ''}`
        .toLowerCase()
        .includes(search.q.toLowerCase())
  );

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='자료 관리'
        description='PDF·영상별 최근 100개 자료의 준비 상태와 접근 범위를 확인합니다.'
        action={
          <Button
            type='primary'
            onClick={() => setRegistrationOpen(true)}>
            학습 자료 등록
          </Button>
        }
      />
      {registrationOpen && (
        <MaterialRegistration onClose={() => setRegistrationOpen(false)} />
      )}
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <ListFilters
        allStatusLabel='전체 종류'
        value={search}
        onChange={change}
        placeholder='자료명 · 등록자 검색'
        statuses={[
          { value: 'pdf', label: 'PDF 자료' },
          { value: 'video', label: '영상 자료' },
        ]}
      />
      <Table
        rowKey='id'
        dataSource={items}
        loading={query.isPending}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='등록된 자료가 없습니다.'
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
            title: '관리',
            key: 'access',
            render: (_, item) => (
              <Space>
                <Button onClick={() => setEditing(item)}>접근 범위</Button>
                {item.kind === 'pdf' && item.owner?.id === access.user.id && (
                  <Button onClick={() => setRecognizing(item)}>
                    글자 인식
                  </Button>
                )}
              </Space>
            ),
          },
          { title: '자료', dataIndex: 'title', width: '36%' },
          {
            title: '종류 · 분량',
            key: 'kind',
            render: (_, item) =>
              item.kind === 'pdf'
                ? `PDF · ${item.pageCount ?? 0}페이지`
                : `영상 · ${item.duration === null ? '길이 미확인' : formatTime(item.duration)}`,
          },
          {
            title: '접근 범위',
            key: 'owner',
            render: (_, item) =>
              item.owner
                ? `개인 · ${item.owner.name || '이름 없음'}`
                : '공유 영상 원본',
          },
          {
            title: '처리 상태',
            dataIndex: 'status',
            render: (status: string) => (
              <Tag
                color={
                  status.toLowerCase() === 'failed'
                    ? 'red'
                    : status.toLowerCase() === 'ready'
                      ? 'green'
                      : 'blue'
                }
                bordered={false}>
                {(
                  {
                    ready: '준비 완료',
                    pending: '대기 중',
                    processing: '처리 중',
                    failed: '처리 실패',
                  } as Record<string, string>
                )[status.toLowerCase()] || status}
              </Tag>
            ),
          },
          { title: '등록일', dataIndex: 'createdAt', render: formatDate },
        ]}
      />
      <Alert
        type='warning'
        title='분석 실패 자료에는 자동·수동 재시도를 제공하지 않습니다. 저장된 정상 결과와 개인 기록은 계속 이용할 수 있습니다.'
      />
      <Card title='자료의 공개 범위와 도우미 배정은 별개입니다'>
        <Typography.Paragraph className='mb-0!'>
          이 목록은 PDF 원본·개인 메모를 제공하지 않습니다. 도우미에게 자료를
          배정해도 해당 학생의 전체 학습 기록이나 비공개 원본이 공개되지
          않습니다.
        </Typography.Paragraph>
      </Card>
      {editing && (
        <MaterialAccessEditor
          key={`${editing.kind}:${editing.id}`}
          material={editing}
          userId={access.user.id}
          onClose={() => setEditing(null)}
        />
      )}
      {recognizing && (
        <MaterialOcrPanel
          key={recognizing.id}
          material={recognizing}
          onClose={() => setRecognizing(null)}
        />
      )}
    </section>
  );
}

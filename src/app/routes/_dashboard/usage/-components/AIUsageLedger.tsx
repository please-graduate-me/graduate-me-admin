import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Card,
  Descriptions,
  Empty,
  Segmented,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { aiUsageQuery } from '@/domains/operations/api/operations';
import { formatDate } from '@/domains/questions/lib/format';
import { ListFilters } from '../../-components/ListFilters';
import { QueryError } from '../../-components/QueryError';
import {
  inPeriod,
  tablePage,
  type ListSearch,
} from '../../-components/listSearch';

const taskLabels: Record<string, string> = {
  explanation: '문맥 설명',
  meaning: '뜻풀이',
  translation: '번역',
  structure: '문장 구조',
  concept: '개념 설명',
  chat: '문맥 질문',
  chat_scope: '질문 관련성 확인',
  practice: '연습 생성',
  practice_generation: '연습 생성',
  grading: '자유 답변 피드백',
  transcription: '영상 전사',
  video_transcription: '영상 전사',
  video_translation: '영상 번역',
  video_blanks: '빈칸 후보',
  prepare: '자료 기본 설명',
  preparation: '자료 준비',
  pdf_ocr: 'PDF 글자 인식 · CLOVA OCR',
};

const cost = (value: number | null) =>
  value === null
    ? '단가 미설정 · 추정 불가'
    : `$${value.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;

/** 토큰·지연 시간은 공급자 결과로 표시하고 추정 비용과 실제 청구액을 분리한다. */
export function AIUsageLedger({
  search,
  provider,
  onChange,
  onProvider,
}: {
  search: ListSearch;
  provider: string;
  onChange: (patch: Partial<ListSearch>) => void;
  onProvider: (provider: string) => void;
}) {
  const query = useQuery(aiUsageQuery);
  const data = query.data;

  const items = (data?.items ?? []).filter(
    (item) =>
      (provider === 'all' || item.provider === provider) &&
      (search.status === 'all' || item.status === search.status) &&
      inPeriod(item.createdAt, search.period) &&
      `${item.id} ${item.model} ${item.task} ${item.sourceKey} ${item.user.name ?? ''}`
        .toLowerCase()
        .includes(search.q.toLowerCase())
  );

  const counts = [
    ['AI 요청', data?.summary.requests],
    ['완료', data?.summary.succeeded],
    ['실패', data?.summary.failed],
    [
      '입력 · 출력 토큰',
      data ? data.summary.inputTokens + data.summary.outputTokens : undefined,
    ],
  ] as const;

  return (
    <div className='flex flex-col gap-5'>
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <Alert
        type='info'
        title='최신 100개 AI 실행의 집계입니다.'
        description='모든 요청은 공급자·작업·사용자·근거별로 기록합니다. 표의 검색과 필터는 이 조회 범위에 적용됩니다.'
      />
      <div className='grid grid-cols-4 gap-5'>
        {counts.map(([title, value]) => (
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
      {data && (
        <Card title='추정 비용과 사용 한도'>
          <Descriptions
            column={3}
            size='small'
            items={[
              {
                key: 'estimated',
                label: '설정 단가 기반 추정 · USD',
                children: cost(data.summary.estimatedCost),
              },
              {
                key: 'actual',
                label: '실제 청구액 · USD',
                children:
                  data.summary.actualCost === null
                    ? '외부 청구 미집계'
                    : cost(data.summary.actualCost),
              },
              {
                key: 'requests',
                label: '사용자별 일일 요청 한도',
                children: `${data.limits.dailyRequests}회`,
              },
              {
                key: 'tokens',
                label: '사용자별 일일 토큰 한도',
                children: `${data.limits.dailyTokens.toLocaleString()}토큰`,
              },
              {
                key: 'concurrent',
                label: '동시 실행 한도',
                children: `${data.limits.concurrentRequests}개`,
              },
              {
                key: 'pages',
                label: '한 번에 준비할 PDF 범위',
                children: `최대 ${data.limits.maxPreparationPages}페이지`,
              },
            ]}
          />
          <Typography.Paragraph
            type='secondary'
            className='mt-3! mb-0!'>
            토큰 합계는 공급자가 반환한 값의 합계입니다. CLOVA OCR은 페이지
            단가로 추정하고 토큰은 미제공으로 표시합니다. 단가가 없는 실행의
            비용은 미집계입니다. 한도에 도달해도 저장된 설명·대화·문제 조회는
            이용할 수 있습니다.
          </Typography.Paragraph>
        </Card>
      )}
      <Segmented
        value={provider}
        onChange={(value) => onProvider(String(value))}
        options={[
          { value: 'all', label: '전체 공급자' },
          { value: 'naver', label: '네이버 AI' },
          { value: 'gemini', label: 'Gemini' },
        ]}
      />
      <ListFilters
        value={search}
        onChange={onChange}
        placeholder='작업 ID · 모델 · 요청자 · 근거 검색'
        statuses={[
          { value: 'running', label: '실행 중' },
          { value: 'succeeded', label: '완료' },
          { value: 'failed', label: '실패' },
        ]}
      />
      <Table
        rowKey='id'
        dataSource={items}
        loading={query.isPending}
        pagination={{
          current: tablePage(search.page, items.length),
          pageSize: 20,
          total: items.length,
          showSizeChanger: false,
          onChange: (page) => onChange({ page }),
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='조건에 맞는 AI 실행 기록이 없습니다.'
            />
          ),
        }}
        expandable={{
          rowExpandable: (item) => Boolean(item.error),
          expandedRowRender: (item) => (
            <Alert
              type='error'
              title={item.error || '실행 실패'}
            />
          ),
        }}
        columns={[
          {
            title: '공급자 · 작업',
            key: 'task',
            render: (_, item) => (
              <>
                <Tag color={item.provider === 'naver' ? 'green' : 'blue'}>
                  {item.task === 'pdf_ocr'
                    ? 'CLOVA OCR'
                    : item.provider === 'naver'
                      ? '네이버'
                      : 'Gemini'}
                </Tag>
                {taskLabels[item.task] || item.task}
                <Typography.Paragraph
                  type='secondary'
                  className='mt-1! mb-0!'>
                  {item.model}
                </Typography.Paragraph>
              </>
            ),
          },
          {
            title: '요청자 · 근거',
            key: 'source',
            render: (_, item) => (
              <>
                {item.user.name || '시스템 또는 삭제 계정'}
                <Typography.Paragraph
                  type='secondary'
                  className='mt-1! mb-0!'
                  ellipsis={{ tooltip: item.sourceKey }}>
                  {item.sourceKey}
                </Typography.Paragraph>
              </>
            ),
          },
          {
            title: '상태',
            dataIndex: 'status',
            render: (status) => (
              <Tag
                color={
                  status === 'failed'
                    ? 'red'
                    : status === 'succeeded'
                      ? 'green'
                      : 'blue'
                }>
                {status === 'failed'
                  ? '실패'
                  : status === 'succeeded'
                    ? '완료'
                    : '실행 중'}
              </Tag>
            ),
          },
          {
            title: '입력 / 출력 토큰',
            key: 'tokens',
            render: (_, item) =>
              `${item.inputTokens?.toLocaleString() ?? '미제공'} / ${item.outputTokens?.toLocaleString() ?? '미제공'}`,
          },
          {
            title: '응답 시간',
            dataIndex: 'elapsedMs',
            render: (value) =>
              value === null
                ? '진행 중 · 미측정'
                : `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}초`,
          },
          { title: '추정 · USD', dataIndex: 'estimatedCost', render: cost },
          { title: '요청 일시', dataIndex: 'createdAt', render: formatDate },
        ]}
      />
    </div>
  );
}

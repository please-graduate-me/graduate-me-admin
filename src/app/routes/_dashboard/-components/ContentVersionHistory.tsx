import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Text } from '@astryxdesign/core/Text';
import { Selector } from '@astryxdesign/core/Selector';
import { Badge } from '@astryxdesign/core/Badge';
import { Stack } from '@astryxdesign/core/Stack';
import { DataTable } from '@/components/ui/DataTable';
import { useState } from 'react';
import type { Content, Revision } from '@/domains/content/model/contracts';
import { formatDate } from '@/domains/questions/lib/format';

const labels: Record<string, string> = {
  translation: '번역',
  meaning: '뜻',
  structure: '문장 구조',
  concept: '개념',
  examples: '추가 예문',
  uncertainty: '불확실성',
  citations: '인용 근거',
  type: '문제 형식',
  question: '문제',
  choices: '선택지',
  answer: '정답 · 참고 답변',
  explanation: '해설',
  hint: '힌트',
  sourceQuote: '정답 근거',
  text: '전사',
  start: '시작 시간',
  end: '종료 시간',
  blankCandidates: '빈칸 단어 번호',
};

const display = (value: unknown): string =>
  value === null || value === undefined
    ? '없음'
    : Array.isArray(value)
      ? value
          .map((item) =>
            typeof item === 'object' && item !== null && 'quote' in item
              ? String(item.quote)
              : String(item)
          )
          .join('\n')
      : typeof value === 'string'
        ? value || '없음'
        : String(value);

/** 이전 내용과 최신 내용을 비교하고 변경 사유·행위자를 같은 위치에 표시한다. */
export function ContentVersionHistory({
  content,
  revisions,
}: {
  content: Content;
  revisions: Revision[];
}) {
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const ordered = [...revisions].sort((a, b) => b.version - a.version);

  const previous =
    ordered.find((item) => item.version === selected) ??
    ordered.find((item) => item.version < content.version) ??
    ordered[0];

  if (!previous) return <EmptyState title='보존된 이전 버전이 없습니다.' />;
  const before = previous.payload as Record<string, unknown>;
  const after = content.payload as Record<string, unknown>;

  const rows = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].map((key) => ({
    key,
    label: labels[key] || key,
    before: display(before[key]),
    after: display(after[key]),
    changed: JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  }));

  return (
    <div className='flex flex-col gap-4'>
      <Stack
        direction='horizontal'
        gap={2}>
        <Text>비교할 이전 버전</Text>
        <Selector
          value={String(previous.version)}
          containerClassName='w-80!'
          onChange={(value) => setSelected(Number(value))}
          options={ordered.map((item) => ({
            value: String(item.version),
            label: `v${item.version} · ${formatDate(item.createdAt)} · ${item.actor.name}`,
          }))}
          label='입력'
          isLabelHidden
        />
        <Badge label={<>현재 v{content.version}</>} />
      </Stack>
      <Text
        className='mb-0!'
        as='p'
        color='secondary'>
        {previous.actor.name} · {previous.reason || '최초 생성'} ·{' '}
        {formatDate(previous.createdAt)}
      </Text>
      <DataTable
        rowKey='key'
        dataSource={rows}
        pagination={false}
        size='small'
        columns={[
          { title: '항목', dataIndex: 'label', width: 130 },
          {
            title: `이전 v${previous.version}`,
            dataIndex: 'before',
            render: (value) => (
              <Text
                className='mb-0!'
                style={{ whiteSpace: 'pre-wrap' }}
                as='p'>
                {value}
              </Text>
            ),
          },
          {
            title: `현재 v${content.version}`,
            dataIndex: 'after',
            render: (value, row) => (
              <Text
                className='mb-0!'
                style={{
                  whiteSpace: 'pre-wrap',
                  fontWeight: row.changed ? 600 : 400,
                }}
                as='p'>
                {value}
                {row.changed && (
                  <Badge
                    variant='blue'
                    className='ml-2!'
                    label={<>변경됨</>}
                  />
                )}
              </Text>
            ),
          },
        ]}
      />
    </div>
  );
}

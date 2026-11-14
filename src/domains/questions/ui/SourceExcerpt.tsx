import { Blockquote } from '@astryxdesign/core/Blockquote';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { Stack } from '@astryxdesign/core/Stack';
import { Button } from '@astryxdesign/core/Button';
import type { Source } from '../model/contracts';
import { sourceLabel } from '../lib/format';
import { sourceHref } from '../lib/sourceHref';

/** 공유 발췌와 원본 접근을 구분하고 뷰어에서 자료 권한을 별도로 확인한다. */
export function SourceExcerpt({ source }: { source: Source }) {
  return (
    <Stack
      className='w-full'
      direction='vertical'
      gap={2}>
      <Stack
        direction='horizontal'
        gap={2}>
        <Icon
          icon='copy'
          size='md'
        />
        <Text weight='semibold'>{sourceLabel(source)}</Text>
      </Stack>
      <Blockquote
        style={{
          margin: 0,
          padding: 16,
          background: 'var(--color-info-muted)',
          borderRadius: 8,
          whiteSpace: 'pre-wrap',
        }}>
        {source.quote}
      </Blockquote>
      <Text
        style={{ fontSize: 12 }}
        color='secondary'>
        질문자가 공유한 발췌만 표시합니다. 개인 메모와 전체 학습 기록은 표시하지
        않습니다.
      </Text>
      <Button
        href={sourceHref(source)}
        target='_blank'
        rel='noreferrer'
        variant='secondary'
        label='근거 원문 열기 · 자료 권한 필요'
      />
      {source.kind === 'video' && source.youtubeId && (
        <Button
          href={`https://www.youtube.com/watch?v=${encodeURIComponent(source.youtubeId)}&t=${Math.floor(source.start ?? 0)}`}
          target='_blank'
          rel='noreferrer'
          variant='secondary'
          label='영상 원문 구간 열기'
        />
      )}
    </Stack>
  );
}

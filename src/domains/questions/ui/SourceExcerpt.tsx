import { Button, Space, Typography, theme } from 'antd';
import type { Source } from '../model/contracts';
import { sourceLabel } from '../lib/format';

/** 배정된 질문의 발췌만 표시하고 비공개 원본 자료 전체로 연결하지 않는다. */
export function SourceExcerpt({ source }: { source: Source }) {
  const { token } = theme.useToken();

  return (
    <Space
      orientation='vertical'
      size={16}
      className='w-full'>
      <Space>
        <img
          src='/icons/source-file-text.svg'
          alt=''
          width={20}
          height={20}
        />
        <Typography.Text strong>{sourceLabel(source)}</Typography.Text>
      </Space>
      <blockquote
        style={{
          margin: 0,
          padding: 16,
          background: token.colorPrimaryBg,
          borderRadius: token.borderRadius,
          whiteSpace: 'pre-wrap',
        }}>
        {source.quote}
      </blockquote>
      <Typography.Text
        type='secondary'
        style={{ fontSize: 12 }}>
        질문자가 공유한 발췌만 표시합니다. 개인 메모와 전체 학습 기록은 표시하지
        않습니다.
      </Typography.Text>
      {source.kind === 'video' && source.youtubeId && (
        <Button
          href={`https://www.youtube.com/watch?v=${encodeURIComponent(source.youtubeId)}&t=${Math.floor(source.start ?? 0)}`}
          target='_blank'
          rel='noreferrer'>
          영상 원문 구간 열기
        </Button>
      )}
    </Space>
  );
}

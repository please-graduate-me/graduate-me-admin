import { aiProviderLabel } from '@/domains/operations/lib/providerLabel';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Empty, Space, Spin, Tag, Typography } from 'antd';
import type { WorkspaceAccess } from '@/domains/auth/model/contracts';
import { contentQuery } from '@/domains/content/api/content';
import type { Content } from '@/domains/content/model/contracts';
import { ContentEditor } from './ContentEditor';

/** 질문자가 공유한 결과를 실제 수정·범위 검토와 연결한다. */
export function QuestionContentPanel({
  questionId,
  access,
}: {
  questionId: string;
  access: WorkspaceAccess;
}) {
  const query = useQuery(contentQuery(questionId));
  const [selected, setSelected] = useState<Content | null>(null);

  return (
    <Card title='공유된 학습 결과 · 검토와 수정'>
      <div className='flex flex-col gap-4'>
        <Typography.Paragraph
          type='secondary'
          className='mb-0!'>
          질문에 연결된 원문·설명·문제만 표시합니다. 학생의 개인 대화·메모·전체
          답안은 열람하지 않습니다.
        </Typography.Paragraph>
        {query.error && (
          <Alert
            type='error'
            title={query.error.message}
            action={<Button onClick={() => query.refetch()}>다시 조회</Button>}
          />
        )}
        {query.isPending && <Spin />}
        {query.data?.items.length === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='공유된 설명·문제·영상 전사가 없습니다.'
          />
        )}
        {query.data?.items.map((content) => (
          <div
            key={`${content.kind}:${content.id}`}
            className='flex items-start justify-between gap-4 rounded-lg border border-(--ant-color-border) p-4'>
            <Space
              orientation='vertical'
              size={8}>
              <Space>
                <Tag color='blue'>
                  {content.kind === 'explanation'
                    ? '문맥 설명'
                    : content.kind === 'practice'
                      ? '적용 문제'
                      : '영상 전사'}
                </Tag>
                <Typography.Text strong>v{content.version}</Typography.Text>
                <Tag
                  color={
                    !content.needsReview && content.reviewStatus === 'verified'
                      ? 'green'
                      : 'orange'
                  }>
                  {content.needsReview ||
                  content.reviewStatus === 'needs_review'
                    ? '재확인 필요'
                    : content.reviewStatus === 'verified'
                      ? '이 버전 검토 완료'
                      : '미검토'}
                </Tag>
                {content.status === 'suspended' && (
                  <Tag color='red'>새 풀이 중단</Tag>
                )}
              </Space>
              <Typography.Text type='secondary'>
                {aiProviderLabel(content.provider)} · {content.model}
              </Typography.Text>
              <Typography.Paragraph
                className='mb-0!'
                style={{ whiteSpace: 'pre-wrap' }}>
                {content.kind === 'practice'
                  ? content.payload.question
                  : content.kind === 'explanation'
                    ? content.payload.translation
                    : content.payload.text}
              </Typography.Paragraph>
            </Space>
            <Button onClick={() => setSelected(content)}>
              내용 · 버전 검토
            </Button>
          </div>
        ))}
      </div>
      {selected && (
        <ContentEditor
          key={`${selected.kind}:${selected.id}:${selected.version}`}
          questionId={questionId}
          content={selected}
          access={access}
          onClose={() => setSelected(null)}
        />
      )}
    </Card>
  );
}

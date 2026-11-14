import { Text } from '@astryxdesign/core/Text';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Spinner } from '@astryxdesign/core/Spinner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Badge } from '@astryxdesign/core/Badge';
import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Card } from '@astryxdesign/core/Card';
import { aiProviderLabel } from '@/domains/operations/lib/providerLabel';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
    <Card padding={5}>
      <Heading level={3}>{'공유된 학습 결과 · 검토와 수정'}</Heading>
      <div className='flex flex-col gap-4'>
        <Text
          className='mb-0!'
          as='p'
          color='secondary'>
          질문에 연결된 원문·설명·문제만 표시합니다. 학생의 개인 대화·메모·전체
          답안은 열람하지 않습니다.
        </Text>
        {query.error && (
          <Banner
            status='error'
            title={query.error.message}
            endContent={
              <Button
                onClick={() => query.refetch()}
                variant='secondary'
                label='다시 조회'
              />
            }
          />
        )}
        {query.isPending && <Spinner label='불러오는 중' />}
        {query.data?.items.length === 0 && (
          <EmptyState title='공유된 설명·문제·영상 전사가 없습니다.' />
        )}
        {query.data?.items.map((content) => (
          <div
            key={`${content.kind}:${content.id}`}
            className='flex items-start justify-between gap-4 rounded-lg border border-(--ant-color-border) p-4'>
            <Stack
              direction='vertical'
              gap={2}>
              <Stack
                direction='horizontal'
                gap={2}>
                <Badge
                  variant='blue'
                  label={
                    <>
                      {content.kind === 'explanation'
                        ? '문맥 설명'
                        : content.kind === 'practice'
                          ? '적용 문제'
                          : '영상 전사'}
                    </>
                  }
                />
                <Text weight='semibold'>v{content.version}</Text>
                <Badge
                  variant={
                    !content.needsReview && content.reviewStatus === 'verified'
                      ? 'green'
                      : 'orange'
                  }
                  label={
                    <>
                      {content.needsReview ||
                      content.reviewStatus === 'needs_review'
                        ? '재확인 필요'
                        : content.reviewStatus === 'verified'
                          ? '이 버전 검토 완료'
                          : '미검토'}
                    </>
                  }
                />
                {content.status === 'suspended' && (
                  <Badge
                    variant='red'
                    label={<>새 풀이 중단</>}
                  />
                )}
              </Stack>
              <Text color='secondary'>
                {aiProviderLabel(content.provider)} · {content.model}
              </Text>
              <Text
                className='mb-0!'
                style={{ whiteSpace: 'pre-wrap' }}
                as='p'>
                {content.kind === 'practice'
                  ? content.payload.question
                  : content.kind === 'explanation'
                    ? content.payload.translation
                    : content.payload.text}
              </Text>
            </Stack>
            <Button
              onClick={() => setSelected(content)}
              variant='secondary'
              label='내용 · 버전 검토'
            />
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

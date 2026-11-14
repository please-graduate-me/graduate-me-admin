import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Text } from '@astryxdesign/core/Text';
import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Card } from '@astryxdesign/core/Card';
import { Banner } from '@astryxdesign/core/Banner';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { reviewQuery } from '@/domains/questions/api/questions';
import { formatDate } from '@/domains/questions/lib/format';
import { SourceExcerpt } from '@/domains/questions/ui/SourceExcerpt';
import { PageHeading } from '../-components/PageHeading';
import { QueryError } from '../-components/QueryError';
import { ReviewDecision } from './-components/ReviewDecision';
import { QuestionContentPanel } from '../-components/QuestionContentPanel';

/** 선택한 검토 요청의 공유 근거와 운영 조치를 연결한다. */
export const Route = createFileRoute('/_dashboard/reviews/$reviewId')({
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/questions' });
  },
  component: ReviewDetail,
});

function ReviewDetail() {
  const { access } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  const { reviewId } = Route.useParams();
  const query = useQuery(reviewQuery(reviewId));

  if (query.error)
    return (
      <QueryError
        error={query.error}
        retry={() => query.refetch()}
      />
    );
  if (query.isPending) return <Spinner label='불러오는 중' />;
  const review = query.data;

  if (!review)
    return (
      <EmptyState
        title={'검토 요청을 찾을 수 없습니다'}
        actions={
          <Button
            onClick={() => void navigate({ to: '/reviews' })}
            variant='secondary'
            label='목록으로'
          />
        }
      />
    );

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='신고 · 수정 요청 상세'
        description='원문과 변경 영향을 확인한 뒤 조치합니다.'
        action={
          <Button
            onClick={() => void navigate({ to: '/reviews' })}
            variant='secondary'
            label='목록으로'
          />
        }
      />
      <Stack
        direction='horizontal'
        gap={2}>
        <Badge
          variant='orange'
          label={
            <>
              {review.status === 'open'
                ? '검토 중'
                : review.status === 'resolved'
                  ? '검토 완료'
                  : '반려'}
            </>
          }
        />
        <Text>
          {review.version} · {formatDate(review.createdAt)}
        </Text>
      </Stack>
      <div className='grid grid-cols-[minmax(0,1.456fr)_minmax(340px,1fr)] items-start gap-6'>
        <Card padding={5}>
          <Heading level={3}>{'신고와 근거'}</Heading>
          <Stack
            className='w-full'
            direction='vertical'
            gap={2}>
            <Heading
              level={4}
              style={{ marginBottom: 0 }}>
              {review.reason}
            </Heading>
            <Text color='secondary'>
              검토 대상:{' '}
              {review.scope === 'source'
                ? '원문'
                : review.scope === 'explanation'
                  ? '설명'
                  : '문제'}{' '}
              · {review.version}
            </Text>
            <SourceExcerpt source={review.source} />
            <Link
              to='/questions/$questionId'
              params={{ questionId: review.questionId }}>
              연결된 질문 확인
            </Link>
          </Stack>
        </Card>
        <ReviewDecision
          key={review.id}
          review={review}
        />
      </div>
      <QuestionContentPanel
        questionId={review.questionId}
        access={access}
      />
      <Banner
        status='warning'
        title='요청 처리 상태와 콘텐츠 버전 검토는 구분합니다. 위의 공유 결과에서 수정·노출 조치를 적용하고, 확인한 사유를 요청 처리 기록에 남겨 주세요.'
      />
    </section>
  );
}

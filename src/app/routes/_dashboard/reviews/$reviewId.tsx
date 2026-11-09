import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import {
  Alert,
  Button,
  Card,
  Result,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { reviewsQuery } from '@/domains/questions/api/questions';
import { formatDate } from '@/domains/questions/lib/format';
import { SourceExcerpt } from '@/domains/questions/ui/SourceExcerpt';
import { PageHeading } from '../-components/PageHeading';
import { QueryError } from '../-components/QueryError';
import { ReviewDecision } from './-components/ReviewDecision';

/** 선택한 검토 요청의 공유 근거와 운영 조치를 연결한다. */
export const Route = createFileRoute('/_dashboard/reviews/$reviewId')({
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/questions' });
  },
  component: ReviewDetail,
});

function ReviewDetail() {
  const navigate = Route.useNavigate();
  const { reviewId } = Route.useParams();
  const query = useQuery(reviewsQuery);

  if (query.error)
    return (
      <QueryError
        error={query.error}
        retry={() => query.refetch()}
      />
    );
  if (query.isPending)
    return (
      <Spin tip='검토 요청을 불러오고 있습니다'>
        <div className='h-64' />
      </Spin>
    );

  const review = query.data?.items.find((item) => item.id === reviewId);

  if (!review)
    return (
      <Result
        status='404'
        title='검토 요청을 찾을 수 없습니다'
        extra={
          <Button onClick={() => void navigate({ to: '/reviews' })}>
            목록으로
          </Button>
        }
      />
    );

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='신고 · 수정 요청 상세'
        description='원문과 변경 영향을 확인한 뒤 조치합니다.'
        action={
          <Button onClick={() => void navigate({ to: '/reviews' })}>
            목록으로
          </Button>
        }
      />
      <Space>
        <Tag
          color='orange'
          bordered={false}>
          {review.status === 'open'
            ? '검토 중'
            : review.status === 'resolved'
              ? '검토 완료'
              : '반려'}
        </Tag>
        <Typography.Text>
          {review.version} · {formatDate(review.createdAt)}
        </Typography.Text>
      </Space>
      <div className='grid grid-cols-[minmax(0,1.456fr)_minmax(340px,1fr)] items-start gap-6'>
        <Card title='신고와 근거'>
          <Space
            orientation='vertical'
            size={20}
            className='w-full'>
            <Typography.Title
              level={4}
              style={{ marginBottom: 0 }}>
              {review.reason}
            </Typography.Title>
            <Typography.Text type='secondary'>
              검토 대상:{' '}
              {review.scope === 'source'
                ? '원문'
                : review.scope === 'explanation'
                  ? '설명'
                  : '문제'}{' '}
              · {review.version}
            </Typography.Text>
            <SourceExcerpt source={review.source} />
            <Link
              to='/questions/$questionId'
              params={{ questionId: review.questionId }}>
              연결된 질문 확인
            </Link>
          </Space>
        </Card>
        <ReviewDecision
          key={review.id}
          review={review}
        />
      </div>
      <Alert
        type='warning'
        title='조치 사유와 처리 상태를 기록합니다. 원문·AI 설명·생성 문제의 실제 수정이나 노출 중단으로 처리하지 않습니다.'
      />
    </section>
  );
}

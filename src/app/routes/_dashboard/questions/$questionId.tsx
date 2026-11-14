import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Button } from '@astryxdesign/core/Button';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { questionQuery } from '@/domains/questions/api/questions';
import { QuestionEditor } from './-components/QuestionEditor';
import { QueryError } from '../-components/QueryError';

/** 질문 식별자를 admin 전용 상세 조회와 연결한다. */
export const Route = createFileRoute('/_dashboard/questions/$questionId')({
  beforeLoad: ({ context }) => {
    if (!context.access.role) throw redirect({ to: '/courses' });
  },
  component: QuestionDetail,
});

function QuestionDetail() {
  const navigate = Route.useNavigate();
  const { questionId } = Route.useParams();
  const { access } = Route.useRouteContext();
  const query = useQuery(questionQuery(questionId));

  if (query.error)
    return (
      <QueryError
        error={query.error}
        retry={() => query.refetch()}
      />
    );
  if (query.isPending) return <Spinner label='불러오는 중' />;
  if (!query.data)
    return (
      <EmptyState
        title={'질문을 찾을 수 없습니다'}
        actions={
          <Button
            onClick={() => void navigate({ to: '/questions' })}
            variant='secondary'
            label='질문함으로'
          />
        }
      />
    );

  return (
    <QuestionEditor
      key={questionId}
      question={query.data}
      access={access}
    />
  );
}

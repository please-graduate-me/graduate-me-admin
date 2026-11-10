import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Button, Result, Spin } from 'antd';
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
  if (query.isPending)
    return (
      <Spin tip='질문을 불러오고 있습니다'>
        <div className='h-64' />
      </Spin>
    );
  if (!query.data)
    return (
      <Result
        status='404'
        title='질문을 찾을 수 없습니다'
        extra={
          <Button onClick={() => void navigate({ to: '/questions' })}>
            질문함으로
          </Button>
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

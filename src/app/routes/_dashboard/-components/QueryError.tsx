import { Alert, Button } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { ApiError } from '@/lib/api/request';

/** 조회 실패와 실제 빈 목록을 구분하고 실패한 조회만 다시 시도한다. */
export function QueryError({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const client = useQueryClient();
  const router = useRouter();
  const expired = error instanceof ApiError && error.status === 401;

  return (
    <Alert
      type='error'
      showIcon
      title={error.message}
      action={
        <Button
          onClick={() => {
            if (expired) {
              client.clear();
              void router.navigate({ to: '/login' });
            } else retry();
          }}>
          {expired ? '다시 로그인' : '다시 불러오기'}
        </Button>
      }
    />
  );
}

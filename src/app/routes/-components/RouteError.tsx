import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { Button, Result } from 'antd';
import { ApiError } from '@/lib/api/request';

/** 내부 오류 정보를 노출하지 않고 화면을 다시 시도하게 한다. */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <Result
      status={
        error instanceof ApiError && error.status === 403 ? '403' : 'error'
      }
      title={
        error instanceof ApiError && error.status === 403
          ? '접근 권한이 없습니다'
          : '화면을 불러오지 못했습니다'
      }
      subTitle={
        error instanceof ApiError
          ? error.message
          : '잠시 후 다시 시도해 주세요.'
      }
      extra={<Button onClick={() => router.invalidate()}>다시 시도</Button>}
    />
  );
}

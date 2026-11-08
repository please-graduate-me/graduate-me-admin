import { useRouter } from '@tanstack/react-router';
import { Button, Result } from 'antd';

/** 내부 오류 정보를 노출하지 않고 화면을 다시 시도하게 한다. */
export function RouteError() {
  const router = useRouter();

  return (
    <Result
      status='error'
      title='화면을 불러오지 못했습니다'
      subTitle='잠시 후 다시 시도해 주세요.'
      extra={<Button onClick={() => router.invalidate()}>다시 시도</Button>}
    />
  );
}

import { Link } from '@tanstack/react-router';
import { Result } from 'antd';

/** 등록되지 않은 경로에서 대시보드로 돌아갈 수 있게 한다. */
export function NotFound() {
  return (
    <Result
      status='404'
      title='페이지를 찾을 수 없습니다'
      subTitle='주소를 확인하거나 대시보드로 이동해 주세요.'
      extra={<Link to='/'>대시보드로 이동</Link>}
    />
  );
}

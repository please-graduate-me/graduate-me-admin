import { RouterLink as Link } from '@/components/ui/RouterLink';
import { EmptyState } from '@astryxdesign/core/EmptyState';

/** 등록되지 않은 경로에서 대시보드로 돌아갈 수 있게 한다. */
export function NotFound() {
  return (
    <EmptyState
      title={'페이지를 찾을 수 없습니다'}
      description={'주소를 확인하거나 대시보드로 이동해 주세요.'}
      actions={<Link to='/'>대시보드로 이동</Link>}
    />
  );
}

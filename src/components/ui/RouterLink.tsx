import { createLink } from '@tanstack/react-router';
import { Link } from '@astryxdesign/core/Link';

/** Astryx 링크의 외형에 TanStack Router의 타입·검색 조건·사전 로딩을 연결한다. */
export const RouterLink = createLink(Link);

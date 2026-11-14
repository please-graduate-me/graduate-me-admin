import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  SideNav,
  SideNavItem,
  SideNavSection,
} from '@astryxdesign/core/SideNav';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import type { WorkspaceAccess } from '@/domains/auth/model/contracts';
import { SidebarIcon } from './SidebarIcon';

const links = [
  { path: '/', label: '운영 현황', icon: 'layout-grid' },
  { path: '/materials', label: '자료 관리', icon: 'file-text' },
  {
    path: '/questions',
    label: '기존 질문 · 자료 신고',
    icon: 'message-circle',
  },
  { path: '/reviews', label: '신고 · 수정 요청', icon: 'flag' },
  { path: '/moderation', label: '게시물 신고', icon: 'flag' },
  { path: '/helpers', label: '조교 자격', icon: 'users' },
  { path: '/usage', label: 'AI 사용량', icon: 'chart-no-axes-column' },
  { path: '/shares', label: '공유 링크', icon: 'file-text' },
  { path: '/events', label: '운영 이력', icon: 'clock' },
] as const;

/** 운영자가 접근할 업무 메뉴와 현재 위치를 Astryx 탐색으로 표시한다. */
export function Sidebar({ access }: { access: WorkspaceAccess }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();

  return (
    <SideNav
      aria-label='admin 주 탐색'
      header={
        <div className='p-3'>
          <Heading level={3}>graduate me</Heading>
          <Text color='secondary'>학습 운영 콘솔</Text>
        </div>
      }
      footer={
        <div className='p-3'>
          <Text>{access.user.name || access.user.email}</Text>
          <Text
            as='p'
            color='secondary'>
            {access.role === 'admin' ? '운영 관리자' : '학과 답변 도우미'}
          </Text>
        </div>
      }>
      <SideNavSection title='운영 관리'>
        {access.role === 'admin' &&
          links.map(({ path, label, icon }) => (
            <SideNavItem
              key={path}
              href={path}
              label={label}
              isSelected={
                path === '/' ? pathname === '/' : pathname.startsWith(path)
              }
              icon={
                <SidebarIcon
                  name={icon}
                  selected={pathname === path}
                />
              }
              onClick={(event) => {
                if (
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.shiftKey &&
                  !event.altKey
                ) {
                  event.preventDefault();
                  void navigate({ to: path });
                }
              }}
            />
          ))}
      </SideNavSection>
    </SideNav>
  );
}

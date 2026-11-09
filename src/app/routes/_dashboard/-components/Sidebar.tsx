import { Link, useLocation } from '@tanstack/react-router';
import { Divider, Menu, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import type { WorkspaceAccess } from '@/domains/auth/model/contracts';
import { SidebarIcon } from './SidebarIcon';
import { adminNavigation } from '../../../theme';

/** 학생의 학습 탐색과 분리해 도우미·운영자의 업무 메뉴만 구성한다. */
export function Sidebar({ access }: { access: WorkspaceAccess }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const { token } = theme.useToken();
  const selected = pathname.startsWith('/questions') ? '/questions' : pathname;

  const items: MenuProps['items'] = [
    {
      type: 'group',
      label: '답변 도우미',
      children: [
        {
          key: '/questions',
          icon: (
            <SidebarIcon
              name='message-circle'
              selected={selected === '/questions'}
            />
          ),
          label: <Link to='/questions'>내 질문함</Link>,
        },
        {
          key: '/events',
          icon: (
            <SidebarIcon
              name='clock'
              selected={selected === '/events'}
            />
          ),
          label: <Link to='/events'>검토 이력</Link>,
        },
      ],
    },
  ];

  if (access.role === 'admin')
    items.push({
      type: 'group',
      label: '운영 관리',
      children: [
        {
          key: '/',
          icon: (
            <SidebarIcon
              name='layout-grid'
              selected={selected === '/'}
            />
          ),
          label: <Link to='/'>운영 현황</Link>,
        },
        {
          key: '/materials',
          icon: (
            <SidebarIcon
              name='file-text'
              selected={selected === '/materials'}
            />
          ),
          label: <Link to='/materials'>자료 관리</Link>,
        },
        {
          key: '/reviews',
          icon: (
            <SidebarIcon
              name='flag'
              selected={selected === '/reviews'}
            />
          ),
          label: <Link to='/reviews'>신고 · 수정 요청</Link>,
        },
        {
          key: '/helpers',
          icon: (
            <SidebarIcon
              name='users'
              selected={selected === '/helpers'}
            />
          ),
          label: <Link to='/helpers'>도우미 · 권한</Link>,
        },
        {
          key: '/usage',
          icon: (
            <SidebarIcon
              name='chart-no-axes-column'
              selected={selected === '/usage'}
            />
          ),
          label: <Link to='/usage'>AI 사용량</Link>,
        },
        {
          key: '/shares',
          icon: (
            <SidebarIcon
              name='file-text'
              selected={selected === '/shares'}
            />
          ),
          label: <Link to='/shares'>공유 링크</Link>,
        },
      ],
    });

  return (
    <nav
      aria-label='admin 주 탐색'
      className='flex h-dvh flex-col p-4'>
      <div className='mb-5 flex flex-col gap-1 px-2 py-2'>
        <Typography.Text
          style={{
            color: token.colorWhite,
            fontFamily: token.fontFamilyCode,
            fontSize: 20,
            fontWeight: 700,
          }}>
          graduate me
        </Typography.Text>
        <Typography.Text style={{ color: adminNavigation.muted, fontSize: 12 }}>
          ADMIN / 학습 운영
        </Typography.Text>
      </div>
      <Menu
        theme='dark'
        mode='inline'
        selectedKeys={[selected]}
        items={items}
      />
      <div className='mt-auto px-2 pt-8'>
        <Divider
          style={{ borderColor: token.colorBorder, margin: '0 0 16px' }}
        />
        <Typography.Paragraph
          style={{ color: token.colorWhite, fontSize: 12, marginBottom: 4 }}>
          {access.user.name || access.user.email} ·{' '}
          {access.role === 'admin' ? '운영 관리자' : '학과 답변 도우미'}
        </Typography.Paragraph>
        <Typography.Text style={{ color: adminNavigation.muted, fontSize: 12 }}>
          {access.role === 'admin'
            ? '운영 권한'
            : `${access.languages.map((l) => (l === 'en' ? '영어' : l === 'th' ? '태국어' : l)).join(', ')} · 배정 자료 ${access.materialIds.length}개`}
        </Typography.Text>
      </div>
    </nav>
  );
}

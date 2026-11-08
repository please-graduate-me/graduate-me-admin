import { useState } from 'react';
import { MenuOutlined } from '@ant-design/icons';
import { Outlet } from '@tanstack/react-router';
import { Button, Drawer, Grid, Layout, Typography } from 'antd';
import { Sidebar } from './Sidebar';

/** 대시보드의 공통 탐색과 반응형 본문 영역을 구성한다. */
export function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const screens = Grid.useBreakpoint();

  return (
    <Layout className='min-h-dvh'>
      <Layout.Sider
        className='max-[991px]:hidden'
        theme='light'
        width={240}>
        <Sidebar />
      </Layout.Sider>
      <Drawer
        title='관리 메뉴'
        placement='left'
        size={240}
        open={menuOpen && !screens.lg}
        onClose={() => setMenuOpen(false)}
        styles={{ body: { padding: 0 } }}>
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </Drawer>
      <Layout className='min-w-0'>
        <Layout.Header className='flex items-center gap-4 px-6'>
          <Button
            className='min-[992px]:hidden'
            type='text'
            icon={<MenuOutlined />}
            aria-label='관리 메뉴 열기'
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          />
          <Typography.Text strong>운영 관리</Typography.Text>
        </Layout.Header>
        <Layout.Content className='p-6 sm:p-8'>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

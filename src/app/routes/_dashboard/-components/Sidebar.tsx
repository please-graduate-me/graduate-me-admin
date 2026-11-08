import { DashboardOutlined } from '@ant-design/icons';
import { Link, useLocation } from '@tanstack/react-router';
import { Menu, Typography } from 'antd';

/** 대시보드 메뉴와 현재 경로의 선택 상태를 연결한다. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <nav aria-label='관리 메뉴'>
      <div className='flex h-16 items-center px-6'>
        <Typography.Text strong>graduate me</Typography.Text>
      </div>
      <Menu
        onClick={onNavigate}
        selectedKeys={[pathname]}
        items={[
          {
            key: '/',
            icon: <DashboardOutlined />,
            label: <Link to='/'>대시보드</Link>,
          },
        ]}
      />
    </nav>
  );
}

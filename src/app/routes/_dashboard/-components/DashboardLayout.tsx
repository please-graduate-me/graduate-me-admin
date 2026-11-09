import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Outlet, useRouteContext } from '@tanstack/react-router';
import { App, Button, Layout, Space, Tag, Typography } from 'antd';
import { authenticate } from '@/domains/auth/api/auth';
import { Sidebar } from './Sidebar';

/** 별도 admin 앱의 데스크톱 셸과 로그인된 업무 역할을 표시한다. */
export function DashboardLayout() {
  const { access } = useRouteContext({ from: '/_dashboard' });
  const client = useQueryClient();
  const { message } = App.useApp();

  const logout = useMutation({
    mutationFn: () => authenticate('signout'),
    onSuccess: () => client.clear(),
    onError: (error) => message.error(error.message),
  });

  return (
    <Layout className='min-h-dvh min-w-[1200px]'>
      <Layout.Sider
        width={240}
        className='sticky! top-0 h-dvh shrink-0'>
        <Sidebar access={access} />
      </Layout.Sider>
      <Layout className='min-w-0'>
        <Layout.Header className='flex items-center justify-between gap-4'>
          <Typography.Text
            type='secondary'
            style={{ fontSize: 12 }}>
            관리 콘솔 / {access.role === 'admin' ? '운영 관리' : '답변 도우미'}
          </Typography.Text>
          <Space size={16}>
            <img
              src='/icons/bell.svg'
              alt=''
              width={20}
              height={20}
            />
            <Typography.Text style={{ fontSize: 12 }}>
              {access.role === 'admin' ? '운영 관리자' : '학과 답변 도우미'}
            </Typography.Text>
            <Tag bordered={false}>admin</Tag>
            <Button
              type='text'
              loading={logout.isPending}
              onClick={() => logout.mutate()}>
              로그아웃
            </Button>
          </Space>
        </Layout.Header>
        <Layout.Content className='min-w-0 p-7'>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

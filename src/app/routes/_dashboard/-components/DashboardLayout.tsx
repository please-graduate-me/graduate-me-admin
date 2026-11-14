import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Outlet, useRouteContext } from '@tanstack/react-router';
import { AppShell } from '@astryxdesign/core/AppShell';
import { TopNav } from '@astryxdesign/core/TopNav';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { logout as signout } from '@/domains/auth/api/auth';
import { Sidebar } from './Sidebar';

/** 운영 역할과 탐색·알림을 Astryx 앱 셸 안에서 연결한다. */
export function DashboardLayout() {
  const { access } = useRouteContext({ from: '/_dashboard' });
  const client = useQueryClient();
  const toast = useToast();

  const logout = useMutation({
    mutationFn: signout,
    onSuccess: () => client.clear(),
    onError: (error) => toast({ type: 'error', body: error.message }),
  });

  return (
    <AppShell
      height='auto'
      contentPadding={6}
      sideNav={<Sidebar access={access} />}
      topNav={
        <TopNav
          label='운영 도구'
          heading={<Text weight='semibold'>graduate me / 운영 관리</Text>}
          endContent={
            <HStack
              gap={3}
              align='center'>
              <Text>{access.user.name ?? '운영 관리자'}</Text>
              <Badge
                label='admin'
                variant='info'
              />
              <Button
                label='로그아웃'
                variant='ghost'
                isLoading={logout.isPending}
                onClick={() => logout.mutate()}
              />
            </HStack>
          }
        />
      }>
      <main className='min-w-0'>
        <Outlet />
      </main>
    </AppShell>
  );
}

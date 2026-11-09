import { createFileRoute, redirect } from '@tanstack/react-router';
import { accessQuery } from '@/domains/auth/api/auth';
import { ApiError } from '@/lib/api/request';
import { DashboardLayout } from './-components/DashboardLayout';

/** URL에 레이아웃 이름을 노출하지 않고 인증된 admin 작업 공간을 적용한다. */
export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async ({ context }) => {
    try {
      const access = await context.queryClient.fetchQuery(accessQuery);

      if (!access.role) throw redirect({ to: '/login' });

      return { access };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401)
        throw redirect({ to: '/login' });

      throw error;
    }
  },
  component: DashboardLayout,
});

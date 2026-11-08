import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from './-components/DashboardLayout';

/** URL에 레이아웃 이름을 노출하지 않고 관리 화면의 공통 틀을 적용한다. */
export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
});

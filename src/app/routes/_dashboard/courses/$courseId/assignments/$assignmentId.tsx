import { createFileRoute } from '@tanstack/react-router';
import { Alert, Typography } from 'antd';

/** 수업 업무는 운영자 세션과 분리된 서비스 웹에서 처리한다. */
export const Route = createFileRoute(
  '/_dashboard/courses/$courseId/assignments/$assignmentId'
)({ component: CoursesMoved });

function CoursesMoved() {
  const studentUrl =
    import.meta.env.VITE_STUDENT_URL || 'http://localhost:3000';

  return (
    <Alert
      type='info'
      title='수업 관리는 서비스 웹으로 이동했습니다.'
      description={
        <Typography.Link href={new URL('/courses', studentUrl).href}>
          내 수업과 과제로 이동
        </Typography.Link>
      }
    />
  );
}

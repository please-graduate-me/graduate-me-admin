import { Banner } from '@astryxdesign/core/Banner';
import { Link as AstryxLink } from '@astryxdesign/core/Link';
import { createFileRoute } from '@tanstack/react-router';

/** 수업 업무는 운영자 세션과 분리된 서비스 웹에서 처리한다. */
export const Route = createFileRoute('/_dashboard/courses/$courseId/')({
  component: CoursesMoved,
});

function CoursesMoved() {
  const studentUrl =
    import.meta.env.VITE_STUDENT_URL || 'http://localhost:3000';

  return (
    <Banner
      status='info'
      title='수업 관리는 서비스 웹으로 이동했습니다.'
      description={
        <AstryxLink href={new URL('/courses', studentUrl).href}>
          내 수업과 과제로 이동
        </AstryxLink>
      }
    />
  );
}

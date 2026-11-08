import { createFileRoute } from '@tanstack/react-router';
import { Card, Empty, Typography } from 'antd';

/** 관리자 초기 화면을 대시보드 기본 경로에 연결한다. */
export const Route = createFileRoute('/_dashboard/')({ component: Dashboard });

function Dashboard() {
  return (
    <section
      aria-labelledby='dashboard-title'
      className='mx-auto max-w-7xl'>
      <Typography.Title
        id='dashboard-title'
        level={2}>
        관리자 작업 공간
      </Typography.Title>
      <Typography.Paragraph type='secondary'>
        서비스 운영에 필요한 작업을 한곳에서 관리합니다.
      </Typography.Paragraph>
      <Card title='관리 메뉴를 준비하고 있습니다'>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description='관리 기능이 연결되면 이곳에서 확인할 수 있습니다.'
        />
      </Card>
    </section>
  );
}

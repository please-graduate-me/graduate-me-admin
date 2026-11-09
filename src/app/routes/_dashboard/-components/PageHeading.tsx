import type { ReactNode } from 'react';
import { Typography } from 'antd';

/** 업무 화면의 제목과 설명을 동일한 데스크톱 위계로 표시한다. */
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className='flex items-center justify-between gap-6'>
      <div>
        <Typography.Title
          level={2}
          style={{ fontSize: 24, lineHeight: '34px', marginBottom: 4 }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph
          type='secondary'
          style={{ marginBottom: 0 }}>
          {description}
        </Typography.Paragraph>
      </div>
      {action}
    </header>
  );
}

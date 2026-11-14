import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import type { ReactNode } from 'react';

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
        <Heading
          level={2}
          style={{ fontSize: 24, lineHeight: '34px', marginBottom: 4 }}>
          {title}
        </Heading>
        <Text
          style={{ marginBottom: 0 }}
          as='p'
          color='secondary'>
          {description}
        </Text>
      </div>
      {action}
    </header>
  );
}

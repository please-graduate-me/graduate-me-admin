import type { ReactNode } from 'react';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Skeleton } from '@astryxdesign/core/Skeleton';

/** 운영 지표의 미확인·로딩 상태와 단위를 같은 형식으로 표시한다. */
export function Metric({
  title,
  value,
  suffix,
  prefix,
  formatter,
  loading,
}: {
  title?: ReactNode;
  value?: string | number;
  suffix?: ReactNode;
  prefix?: ReactNode;
  formatter?: (value: string | number) => ReactNode;
  loading?: boolean;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <Text
        color='secondary'
        size='sm'>
        {title}
      </Text>
      {loading ? (
        <Skeleton
          width={100}
          height={36}
        />
      ) : (
        <Heading level={2}>
          {prefix}
          {formatter ? formatter(value ?? 0) : (value ?? '미확인')}
          {suffix}
        </Heading>
      )}
    </div>
  );
}

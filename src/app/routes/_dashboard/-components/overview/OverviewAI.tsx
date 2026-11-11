import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Card, Progress, Statistic, Typography } from 'antd';
import { aiUsageQuery } from '@/domains/operations/api/operations';
import { QueryError } from '../QueryError';

/** 선택 기간의 전체 AI 실행 집계와 측정되지 않은 비용을 구분한다. */
export function OverviewAI({ period }: { period: 'all' | '7' | '30' }) {
  const query = useQuery(
    aiUsageQuery({ page: 1, q: '', status: 'all', provider: 'all', period })
  );

  const summary = query.data?.summary;
  const finished = summary ? summary.succeeded + summary.failed : 0;

  return (
    <Card
      title='AI 실행 요약'
      extra={
        <Link
          to='/usage'
          search={{ period, view: 'ai' }}>
          실행 기록 보기
        </Link>
      }>
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <div className='grid grid-cols-2 gap-5'>
        {[
          ['전체 요청', summary?.requests],
          ['실행 중', summary?.running],
          ['성공', summary?.succeeded],
          ['실패', summary?.failed],
        ].map(([title, value]) => (
          <Statistic
            key={title}
            title={title}
            value={value}
            loading={query.isPending}
            formatter={(shown) => (value === undefined ? '미확인' : shown)}
          />
        ))}
      </div>
      <div className='my-5'>
        <Typography.Text>완료된 요청의 성공률</Typography.Text>
        {summary && finished > 0 ? (
          <Progress
            percent={Math.round((summary.succeeded / finished) * 100)}
          />
        ) : (
          <Typography.Paragraph type='secondary'>
            {summary
              ? '완료된 요청이 없어 성공률을 계산하지 않습니다.'
              : '요청 집계를 확인하지 못했습니다.'}
          </Typography.Paragraph>
        )}
      </div>
      <div className='flex flex-col gap-2'>
        <Typography.Text>
          입력 · 출력 토큰:{' '}
          {summary
            ? (summary.inputTokens + summary.outputTokens).toLocaleString(
                'ko-KR'
              )
            : '미확인'}
        </Typography.Text>
        <Typography.Text>
          추정 비용:{' '}
          {summary?.estimatedCost == null
            ? '추정 불가'
            : `$${summary.estimatedCost.toLocaleString('en-US', { maximumFractionDigits: 6 })}`}
        </Typography.Text>
        <Typography.Text type='secondary'>
          추정 비용은 설정 단가 기준이며 실제 청구액과 다릅니다. 토큰 미측정
          요청: {summary?.unmeasuredRequests ?? '미확인'}건
        </Typography.Text>
      </div>
    </Card>
  );
}

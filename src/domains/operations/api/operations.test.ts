import { QueryClient } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { aiUsageQuery, usageQuery } from './operations';

afterEach(() => vi.unstubAllGlobals());

it('100개 이후 AI 페이지와 필터 전체 집계를 유지하고 조건별 캐시를 분리한다', async () => {
  const result = {
    items: [],
    page: 6,
    limit: 20,
    total: 103,
    hasMore: false,
    currency: 'USD',
    summary: {
      requests: 103,
      succeeded: 101,
      failed: 2,
      running: 0,
      reservedTokens: 0,
      unmeasuredRequests: 1,
      inputTokens: 10000,
      outputTokens: 2000,
      estimatedCost: null,
      actualCost: null,
    },
    limits: {
      dailyRequests: 30,
      dailyTokens: 50000,
      concurrentRequests: 1,
      maxPreparationPages: 3,
    },
  };

  const fetcher = vi.fn<typeof fetch>(async () => Response.json(result));

  vi.stubGlobal('fetch', fetcher);

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const search = {
    page: 6,
    q: '학습 % 검색',
    status: 'failed',
    period: '30',
    provider: 'anthropic',
  };

  try {
    expect(await client.fetchQuery(aiUsageQuery(search))).toEqual(result);

    const url = new URL(
      String(fetcher.mock.calls[0][0]),
      'http://test.invalid'
    );

    expect(Object.fromEntries(url.searchParams)).toEqual({
      ...search,
      page: '6',
      limit: '20',
    });

    expect(aiUsageQuery(search).queryKey).not.toEqual(
      aiUsageQuery({ ...search, page: 1 }).queryKey
    );

    expect(aiUsageQuery(search).queryKey).not.toEqual(
      aiUsageQuery({ ...search, provider: 'all' }).queryKey
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
  } finally {
    client.clear();
  }
});

it('큐의 현재 페이지와 검색 전체 상태 요약을 따로 검증하고 조회만 전송한다', async () => {
  const result = {
    items: [],
    page: 6,
    limit: 20,
    total: 103,
    hasMore: false,
    summary: { total: 103, completed: 1, failed: 2, processing: 100 },
  };

  const fetcher = vi.fn<typeof fetch>(async () => Response.json(result));

  vi.stubGlobal('fetch', fetcher);

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const search = { page: 6, q: '과거 작업', status: 'all', period: '7' };

  try {
    expect(await client.fetchQuery(usageQuery(search))).toEqual(result);

    const url = new URL(
      String(fetcher.mock.calls[0][0]),
      'http://test.invalid'
    );

    expect(url.pathname).toBe('/api/admin/workspace/usage');

    expect(Object.fromEntries(url.searchParams)).toEqual({
      ...search,
      page: '6',
      limit: '20',
    });

    expect(fetcher.mock.calls[0][1]?.method).toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);
  } finally {
    client.clear();
  }
});

import { QueryClient } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { materialOcrQuery, requestMaterialOcr } from './ocr';

afterEach(() => vi.unstubAllGlobals());

it('저장 OCR 조회와 명시적 생성을 구분하고 원본 버전·영역 신뢰도를 보존한다', async () => {
  const requestId = '3b0797c0-0c64-4aa9-b152-19874d2fa379';

  const result = {
    configured: true,
    supportedLanguages: ['en'],
    languageSupported: true,
    item: {
      id: requestId,
      materialId: 'material',
      version: 2,
      page: 3,
      status: 'ready',
      text: 'Hello',
      fields: [
        {
          text: 'Hello',
          rect: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 },
          confidence: 0.75,
          lineBreak: true,
        },
      ],
      width: 600,
      height: 800,
      lowConfidenceCount: 1,
      error: null,
      createdAt: '2026-11-09T00:00:00.000Z',
      updatedAt: '2026-11-09T00:00:00.000Z',
    },
  };

  const fetcher = vi.fn().mockImplementation(async () => Response.json(result));

  vi.stubGlobal('fetch', fetcher);

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  try {
    expect(await client.fetchQuery(materialOcrQuery('material', 2, 3))).toEqual(
      result
    );

    expect(fetcher.mock.calls[0][0]).toBe(
      '/api/materials/material/ocr?version=2&page=3'
    );

    expect(fetcher.mock.calls[0][1].method).toBeUndefined();

    expect(
      await requestMaterialOcr('material', { requestId, version: 2, page: 3 })
    ).toEqual(result);

    expect(fetcher.mock.calls[1][0]).toBe('/api/materials/material/ocr');
    expect(fetcher.mock.calls[1][1].method).toBe('POST');

    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
      requestId,
      version: 2,
      page: 3,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  } finally {
    client.clear();
  }
});

import { expect, it } from 'vitest';
import { sourceHref } from './sourceHref';

it('공유한 OCR 발췌의 과거 버전·페이지·영역을 학생 뷰어에 전달한다', () => {
  const rect = { x: 0.1, y: 0.2, width: 0.4, height: 0.1 };

  const href = sourceHref({
    kind: 'pdf',
    materialId: '자료/id',
    title: '자료',
    language: 'en',
    page: 3,
    quote: 'Learning opens doors.',
    version: 2,
    ocrId: '인식',
    rects: [rect],
  });

  const url = new URL(href, 'https://pleasegraduate.me');

  expect(url.pathname).toBe('/materials/%EC%9E%90%EB%A3%8C%2Fid');

  expect(Object.fromEntries(url.searchParams)).toEqual({
    page: '3',
    quote: 'Learning opens doors.',
    version: '2',
    ocrId: '인식',
    rect: JSON.stringify(rect),
  });
});

it('영상 질문의 원문 이동도 선택 구절과 버전을 보존한다', () => {
  const url = new URL(
    sourceHref({
      kind: 'video',
      videoId: 'video',
      segmentId: 'segment',
      title: '영상',
      language: 'th',
      quote: 'ภาษาไทย',
      version: 4,
    }),
    'https://pleasegraduate.me'
  );

  expect(url.pathname).toBe('/learn/video');
  expect(url.searchParams.get('segment')).toBe('segment');
  expect(url.searchParams.get('version')).toBe('4');
});

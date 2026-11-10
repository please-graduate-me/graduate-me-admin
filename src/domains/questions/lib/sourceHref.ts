import type { Source } from '../model/contracts';

/** 발췌의 위치·버전을 학생 뷰어에 전달하되 원본 접근 권한은 별도로 검사하게 한다. */
export function sourceHref(source: Source) {
  const query = new URLSearchParams({
    page: String(source.kind === 'pdf' ? source.page : 1),
    quote: source.quote,
    version: String(source.version),
  });

  if (source.kind === 'pdf' && source.ocrId) query.set('ocrId', source.ocrId);
  if (source.kind === 'pdf' && source.rects?.[0])
    query.set('rect', JSON.stringify(source.rects[0]));
  if (source.kind === 'video') query.set('segment', source.segmentId);

  return `${source.kind === 'pdf' ? `/materials/${encodeURIComponent(source.materialId)}` : `/learn/${encodeURIComponent(source.videoId)}`}?${query}`;
}

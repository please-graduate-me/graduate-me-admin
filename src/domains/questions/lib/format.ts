import type { Source } from '../model/contracts';

/** 원문 위치를 자료의 종류에 맞게 간결하게 표시한다. */
export function sourceLabel(source: Source) {
  return `${source.title} · ${source.kind === 'pdf' ? `p.${source.page}` : formatTime(source.start ?? 0)}`;
}

/** 영상 원문 위치의 초를 분과 초로 표시한다. */
export function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

/** 이력 시각은 사용자의 현재 시간대에서 읽을 수 있게 표시한다. */
export function formatDate(value: string | null) {
  if (!value) return '기록 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

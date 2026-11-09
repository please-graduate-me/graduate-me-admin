import { z } from 'zod';
import type { SearchSchemaInput } from '@tanstack/react-router';

const listSearchSchema = z.object({
  q: z.string().catch(''),
  status: z.string().catch('all'),
  period: z.enum(['all', '7', '30']).catch('all'),
  page: z.coerce.number().int().min(1).catch(1),
});

/** 화면 목록의 검색 조건은 URL에서 복원한다. */
export type ListSearch = z.infer<typeof listSearchSchema>;

/** 잘못된 검색 주소는 안전한 기본 목록 조건으로 해석한다. */
export const parseListSearch = (
  search: Partial<ListSearch> & SearchSchemaInput
) => listSearchSchema.parse(search);

/** 날짜 범위는 화면 목록에만 적용하고 서버 권한 판정을 대신하지 않는다. */
export function inPeriod(createdAt: string, period: ListSearch['period']) {
  return (
    period === 'all' ||
    Date.parse(createdAt) >= Date.now() - Number(period) * 86_400_000
  );
}

/** 현재 페이지가 줄어든 결과를 벗어나면 첫 페이지로 표시한다. */
export function tablePage(page: number, count: number) {
  return page <= Math.max(1, Math.ceil(count / 20)) ? page : 1;
}

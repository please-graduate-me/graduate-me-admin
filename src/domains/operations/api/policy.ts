import { queryOptions } from '@tanstack/react-query';
import { request } from '@/lib/api/request';
import { learningPolicySchema } from '../model/policy';

/** 운영자 등록 화면도 서버가 정한 현재 사용자별 한도를 조회한다. */
export const learningPolicyQuery = queryOptions({
  queryKey: ['learning', 'policy'],
  queryFn: ({ signal }) =>
    request('/api/admin/resources/policy', learningPolicySchema, { signal }),
});

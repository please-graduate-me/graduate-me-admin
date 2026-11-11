import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { request, jsonBody } from '@/lib/api/request';
import { materialOcrSchema, type MaterialOcrInput } from '../model/ocr';

/** 페이지 조회는 저장된 OCR 상태만 읽고 공급자를 실행하지 않는다. */
export const materialOcrQuery = (id: string, version: number, page: number) =>
  queryOptions({
    queryKey: ['workspace', 'material-ocr', id, version, page],
    enabled: version > 0,
    queryFn: ({ signal }) =>
      request(
        `/api/admin/resources/materials/${encodeURIComponent(id)}/ocr?${new URLSearchParams({ version: String(version), page: String(page) })}`,
        materialOcrSchema,
        { signal }
      ),
    refetchInterval: (query) =>
      query.state.data?.item?.status === 'running' ? 2000 : false,
  });

/** 한 페이지의 명시적 생성 요청에는 원본 파일이나 공급자 키를 넣지 않는다. */
export function requestMaterialOcr(id: string, input: MaterialOcrInput) {
  return request(
    `/api/admin/resources/materials/${encodeURIComponent(id)}/ocr`,
    materialOcrSchema,
    jsonBody(input)
  );
}

/** 원본 소유자의 명시적인 클릭만 OCR 생성 요청으로 보낸다. */
export function useMaterialOcr(id: string) {
  const client = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: (input: MaterialOcrInput) => requestMaterialOcr(id, input),
    onSettled: async () => {
      await client.invalidateQueries({
        queryKey: ['workspace', 'material-ocr', id],
      });

      await client.invalidateQueries({ queryKey: ['workspace', 'ai-usage'] });
    },
  });
}

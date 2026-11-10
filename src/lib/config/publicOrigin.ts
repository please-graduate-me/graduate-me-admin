import { z } from 'zod';

const publicOriginSchema = z.url().refine((value) => {
  const url = new URL(value);

  // 공개 앱 이동 설정에 실행 스킴이나 자격 증명·숨은 경로가 섞이지 않게 한다.
  return (
    ['https:', 'http:'].includes(url.protocol) &&
    !url.username &&
    !url.password &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash
  );
}, '공개 주소는 계정 정보·하위 경로·쿼리 없는 HTTP 또는 HTTPS 출처여야 합니다.');

/** 공개 앱 주소를 출처로 제한하고 미설정은 기존 동일 출처 이동으로 유지한다. */
export function parsePublicOrigin(value: string | undefined) {
  const input = value?.trim();

  return input ? new URL(publicOriginSchema.parse(input)).origin : undefined;
}

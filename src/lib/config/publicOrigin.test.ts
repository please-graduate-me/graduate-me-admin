import { expect, it } from 'vitest';
import { parsePublicOrigin } from './publicOrigin';

it('독립 공개 출처와 로컬 출처를 정규화하고 미설정은 유지한다', () => {
  expect(parsePublicOrigin('https://pleasegraduate.me/')).toBe(
    'https://pleasegraduate.me'
  );

  expect(parsePublicOrigin('http://localhost:3000')).toBe(
    'http://localhost:3000'
  );

  expect(parsePublicOrigin('')).toBeUndefined();
  expect(parsePublicOrigin(undefined)).toBeUndefined();
});

it('실행 스킴·계정 정보·하위 경로가 포함된 공개 설정을 거부한다', () => {
  for (const input of [
    'javascript:alert(1)',
    'data:text/html,내용',
    'https://user:password@example.test',
    'https://example.test/student/',
    'https://example.test/?redirect=evil',
    'https://example.test/#fragment',
  ]) {
    expect(() => parsePublicOrigin(input)).toThrow();
  }
});

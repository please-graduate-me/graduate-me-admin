import type { z } from 'zod';

/** HTTP 상태와 사용자에게 보여줄 서버 오류를 함께 보존한다. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 응답을 검증하고 인증 쿠키와 취소 신호를 동일 출처 요청에 전달한다. */
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', ...init });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';

    throw new ApiError(response.status, message);
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success)
    throw new ApiError(502, '서버 응답 형식을 확인할 수 없습니다.');

  return parsed.data;
}

/** 변경 데이터의 전송 형식을 화면 동작에서 분리한다. */
export function jsonBody(body: unknown, method = 'POST'): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

import { z } from 'zod';

const unit = z.number().min(0).max(1);

/** OCR 영역과 신뢰도는 서버가 검증한 정규화 좌표로 표시한다. */
export const ocrFieldSchema = z.object({
  text: z.string(),
  rect: z.object({ x: unit, y: unit, width: unit, height: unit }),
  confidence: unit,
  lineBreak: z.boolean(),
});

/** 원본 버전과 페이지에 고정된 저장 OCR 상태만 관리 화면에 제공한다. */
export const materialOcrSchema = z.object({
  configured: z.boolean(),
  supportedLanguages: z.array(z.literal('en')),
  languageSupported: z.boolean(),
  item: z
    .object({
      id: z.uuid(),
      materialId: z.string(),
      version: z.number().int().positive(),
      page: z.number().int().positive(),
      status: z.enum(['running', 'ready', 'failed']),
      text: z.string(),
      fields: z.array(ocrFieldSchema),
      width: z.number().positive().nullable(),
      height: z.number().positive().nullable(),
      lowConfidenceCount: z.number().int().nonnegative(),
      error: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
});

/** OCR 실행에는 현재 원본 버전과 한 페이지만 명시한다. */
export type MaterialOcrInput = {
  requestId: string;
  version: number;
  page: number;
};

import type { Content } from '@/domains/content/model/contracts';

/** 편집 입력은 원문·설명·문제의 고유 필드를 유지한다. */
export type ContentEditorValues = {
  reason: string;
  translation?: string;
  meaning?: string;
  structure?: string;
  concept?: string;
  examplesText?: string;
  uncertainty?: string;
  type?: 'choice' | 'short_answer' | 'free_response';
  question?: string;
  choicesText?: string;
  answer?: string;
  explanation?: string;
  hint?: string;
  sourceQuote?: string;
  text?: string;
  start?: number;
  end?: number;
  blankCandidates?: number[];
};

/** 빈칸 인덱스는 영어 공백 단위와 태국어 전체 분절 단위를 그대로 따른다. */
export function candidateUnits(text: string, language: string) {
  return language === 'th'
    ? [
        ...new Intl.Segmenter('th', { granularity: 'word' }).segment(
          text.trim()
        ),
      ].map((item) => item.segment)
    : text.trim().split(/\s+/).filter(Boolean);
}

/** 배열 입력을 줄 단위로 편집하되 기존 원문 근거는 숨겨서 바꾸지 않는다. */
export function contentEditorValues(content: Content): ContentEditorValues {
  if (content.kind === 'explanation')
    return {
      ...content.payload,
      examplesText: content.payload.examples.join('\n'),
      reason: '',
    };
  if (content.kind === 'practice')
    return {
      ...content.payload,
      choicesText: content.payload.choices.join('\n'),
      reason: '',
    };

  return {
    ...content.payload,
    translation: content.payload.translation ?? '',
    blankCandidates: content.payload.blankCandidates ?? [],
    reason: '',
  };
}

/** 제출하는 새 버전은 명시적으로 편집한 필드만 현재 근거와 결합한다. */
export function contentEditorPayload(
  content: Content,
  values: ContentEditorValues
): Content['payload'] {
  if (content.kind === 'explanation')
    return {
      ...content.payload,
      translation: values.translation?.trim() ?? '',
      meaning: values.meaning?.trim() ?? '',
      structure: values.structure?.trim() ?? '',
      concept: values.concept?.trim() ?? '',
      examples: (values.examplesText ?? '')
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean),
      uncertainty: values.uncertainty?.trim() ?? '',
    };
  if (content.kind === 'practice')
    return {
      ...content.payload,
      type: values.type ?? content.payload.type,
      question: values.question?.trim() ?? '',
      choices:
        (values.type ?? content.payload.type) === 'choice'
          ? (values.choicesText ?? '')
              .split(/\r?\n/)
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
      answer: values.answer?.trim() ?? '',
      explanation: values.explanation?.trim() ?? '',
      hint: values.hint?.trim() ?? '',
      sourceQuote: values.sourceQuote?.trim() ?? content.payload.sourceQuote,
    };

  return {
    text: values.text?.trim() ?? '',
    start: values.start ?? content.payload.start,
    end: values.end ?? content.payload.end,
    translation: values.translation?.trim() || null,
    blankCandidates: values.blankCandidates?.length
      ? values.blankCandidates
      : content.payload.blankCandidates === null
        ? null
        : [],
  };
}

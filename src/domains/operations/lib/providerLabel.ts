/** 저장된 실행의 실제 공급자를 표시하고 미등록 값은 그대로 보존한다. */
export function aiProviderLabel(provider: string) {
  const labels: Record<string, string> = {
    naver: '네이버',
    anthropic: 'Anthropic(Claude)',
    gemini: 'Google(Gemini)',
    source: '원본',
  };

  return labels[provider] ?? provider;
}

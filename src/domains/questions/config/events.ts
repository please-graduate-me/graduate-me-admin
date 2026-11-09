/** 내부 동작 식별자를 사용자에게 읽히는 한국어 이력명으로 변환한다. */
export const eventLabels: Record<string, string> = {
  question_created: '질문 접수',
  question_follow_up: '학생 추가 질문',
  draft_saved: '답변 초안 · 내부 메모 저장',
  answer_published: '답변 게시',
  assignment_changed: '질문 배정 변경',
  review_requested: '검토 요청 접수',
  review_resolved: '검토 조치 기록',
  helper_permissions_changed: '도우미 배정 · 권한 변경',
};

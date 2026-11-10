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
  content_revised: '원문 · 학습 결과 새 버전 적용',
  content_reviewed: '대상 버전 검토',
  practice_visibility_changed: '문제 노출 상태 변경',
  community_moderated: '커뮤니티 게시물 신고 · 노출 조치',
  material_access_changed: '원본 자료 접근 범위 변경',
};

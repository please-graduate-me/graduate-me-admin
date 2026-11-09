import { Tag } from 'antd';

/** 질문 상태를 색과 문구로 함께 구분한다. */
export function QuestionStatus({ status }: { status: 'waiting' | 'answered' }) {
  return (
    <Tag
      color={status === 'waiting' ? 'blue' : 'green'}
      bordered={false}>
      {status === 'waiting' ? '답변 대기' : '답변 완료'}
    </Tag>
  );
}

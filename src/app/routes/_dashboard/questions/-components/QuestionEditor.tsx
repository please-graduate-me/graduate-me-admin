import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
  theme,
} from 'antd';
import type { WorkspaceAccess } from '@/domains/auth/model/contracts';
import { useQuestionMutation } from '@/domains/questions/api/questions';
import { formatDate, sourceLabel } from '@/domains/questions/lib/format';
import type { QuestionDetail } from '@/domains/questions/model/contracts';
import { QuestionStatus } from '@/domains/questions/ui/QuestionStatus';
import { SourceExcerpt } from '@/domains/questions/ui/SourceExcerpt';
import { PageHeading } from '../../-components/PageHeading';
import { contentQuery } from '@/domains/content/api/content';
import { QuestionContentPanel } from '../../-components/QuestionContentPanel';

type EditorValues = { draft: string; internalNote: string };
type ReviewValues = {
  scope: 'source' | 'explanation' | 'question';
  version: string;
  reason: string;
  targetKey?: string;
};

/** 공개 답변과 내부 메모를 분리해 저장하고 근거·검토 범위를 함께 표시한다. */
export function QuestionEditor({
  question,
  access,
}: {
  question: QuestionDetail;
  access: WorkspaceAccess;
}) {
  const [form] = Form.useForm<EditorValues>();
  const [reviewForm] = Form.useForm<ReviewValues>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const navigate = useNavigate();
  const submitting = useRef(false);
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const mutation = useQuestionMutation(question.id);
  const content = useQuery(contentQuery(question.id));
  const selectedTargetKey = Form.useWatch('targetKey', reviewForm);

  async function save(publish: boolean) {
    // 폼 검증이 끝나기 전의 연속 클릭도 중복 답변 게시로 이어지지 않게 한다.
    if (submitting.current) return;
    submitting.current = true;

    try {
      const values = await form.validateFields();

      await mutation.mutateAsync({
        action: 'save',
        draft: values.draft,
        ...(access.canReview ? { internalNote: values.internalNote } : {}),
      });

      if (publish) {
        if (!values.draft.trim()) {
          message.warning('게시할 답변을 작성해 주세요.');

          return;
        }

        const result = await mutation.mutateAsync({
          action: 'answer',
          body: values.draft.trim(),
        });

        form.setFieldsValue({
          draft: result.draft,
          internalNote: result.internalNote,
        });
      }

      message.success(
        publish ? '답변을 게시했습니다.' : '초안과 내부 메모를 저장했습니다.'
      );
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      submitting.current = false;
    }
  }

  async function createReview() {
    // 답변 저장과 검토 요청의 동시 제출로 중복 이력이 생기지 않게 한다.
    if (submitting.current) return;
    submitting.current = true;

    try {
      const values = await reviewForm.validateFields();

      const target = content.data?.items.find(
        (item) => `${item.kind}:${item.id}` === values.targetKey
      );

      await mutation.mutateAsync({
        action: 'reviews',
        scope: values.scope,
        version: values.version,
        reason: values.reason,
        ...(target
          ? {
              target: {
                kind: target.kind,
                id: target.id,
                version: target.version,
              },
            }
          : {}),
      });

      message.success('검토 요청을 기록했습니다.');
      setReviewOpen(false);
      reviewForm.resetFields();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='질문 상세'
        description='공유된 원문 근거를 확인하고 답변을 작성합니다.'
        action={
          <Button onClick={() => void navigate({ to: '/questions' })}>
            질문함으로
          </Button>
        }
      />
      <Space size={12}>
        {question.kind === 'report' && <Tag color='red'>학생 오류 신고</Tag>}
        {question.resolvedAt && <Tag color='green'>학생이 해결 확인</Tag>}
        <Tag bordered={false}>#{question.id.slice(0, 8)}</Tag>
        <QuestionStatus status={question.status} />
        <Typography.Text type='secondary'>
          담당{' '}
          {question.assignee ? question.assignee.name || '이름 없음' : '미배정'}{' '}
          · {formatDate(question.createdAt)}
        </Typography.Text>
      </Space>
      {question.kind !== 'report' && (
        <Alert
          type='info'
          title='기존 개인 질문은 이력으로 보존합니다. 새 학습 질문과 조교 답변은 커뮤니티에서 작성합니다.'
        />
      )}
      <div className='grid grid-cols-[minmax(0,1.456fr)_minmax(340px,1fr)] items-start gap-6'>
        <Card title='자료 신고 · 기존 질문 기록'>
          <Space
            orientation='vertical'
            size={16}
            className='w-full'>
            <Typography.Title
              level={4}
              style={{ marginBottom: 0 }}>
              {question.title}
            </Typography.Title>
            <Typography.Text
              type='secondary'
              style={{ fontSize: 12 }}>
              질문자 {question.author.name || '이름 없음'} · 운영자에게 공유
            </Typography.Text>
            <Typography.Paragraph
              style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {question.body}
            </Typography.Paragraph>
            <Form
              form={form}
              layout='vertical'
              initialValues={{
                draft: question.draft,
                internalNote: question.internalNote,
              }}
              className='w-full'>
              <Form.Item
                name='draft'
                label='학생에게 공개되는 답변'
                rules={[
                  {
                    max: 10000,
                    message: '답변은 10,000자 이내로 작성해 주세요.',
                  },
                ]}>
                <Input.TextArea
                  rows={5}
                  maxLength={10000}
                  placeholder='원문을 바탕으로 답변을 작성해 주세요.'
                />
              </Form.Item>
              <Form.Item
                name='internalNote'
                label='내부 검토 메모 · 학생에게 비공개'
                extra={
                  !access.canReview
                    ? '내부 메모 작성에는 검토 권한이 필요합니다.'
                    : undefined
                }
                rules={[
                  {
                    max: 10000,
                    message: '메모는 10,000자 이내로 작성해 주세요.',
                  },
                ]}>
                <Input.TextArea
                  rows={3}
                  maxLength={10000}
                  disabled={!access.canReview}
                  placeholder='검토 근거와 후속 작업을 기록해 주세요.'
                />
              </Form.Item>
              <Space>
                <Button
                  loading={mutation.isPending}
                  onClick={() => save(false)}>
                  초안 저장
                </Button>
                <Button
                  type='primary'
                  loading={mutation.isPending}
                  disabled={question.kind !== 'report'}
                  onClick={() => save(true)}>
                  답변 게시
                </Button>
              </Space>
            </Form>
            <Typography.Text
              type='secondary'
              style={{ fontSize: 12 }}>
              게시한 답변은 학생의 질문 상세에 표시됩니다. 내부 메모는 공개하지
              않습니다.
            </Typography.Text>
          </Space>
        </Card>
        <div className='flex flex-col gap-5'>
          <Card title='원문 근거'>
            <SourceExcerpt source={question.source} />
          </Card>
          <Card title='검토 요청'>
            <Space
              orientation='vertical'
              size={16}
              className='w-full'>
              <Tag
                color='orange'
                bordered={false}>
                선택한 구절 · 대상 버전
              </Tag>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                답변 게시와 설명·문제 검토 요청은 별도로 처리합니다.
              </Typography.Paragraph>
              {question.reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: 12,
                    background: token.colorFillAlter,
                    borderRadius: token.borderRadius,
                  }}>
                  <Space>
                    <Tag>
                      {review.scope === 'source'
                        ? '원문'
                        : review.scope === 'explanation'
                          ? '설명'
                          : '문제'}
                    </Tag>
                    <Typography.Text>{review.version}</Typography.Text>
                    <Tag color={review.status === 'open' ? 'orange' : 'green'}>
                      {review.status === 'open'
                        ? '검토 중'
                        : review.status === 'resolved'
                          ? '검토 완료'
                          : '반려'}
                    </Tag>
                  </Space>
                  <Typography.Paragraph className='mt-2! mb-0!'>
                    {review.reason}
                  </Typography.Paragraph>
                  {review.resolution && (
                    <Typography.Paragraph
                      className='mt-2! mb-0!'
                      type='secondary'>
                      {review.resolution}
                    </Typography.Paragraph>
                  )}
                </div>
              ))}
              <Button
                disabled={!access.canReview || !access.canRequestEdit}
                onClick={() => setReviewOpen(true)}>
                검토 요청 작성
              </Button>
              <Typography.Text
                type='secondary'
                style={{ fontSize: 12 }}>
                자료 전체가 아닌 지정한 구절·대상·버전에 적용됩니다. 공유된
                결과에서 실제 내용을 검토하고 새 버전을 적용할 수 있습니다.
              </Typography.Text>
            </Space>
          </Card>
        </div>
      </div>
      {question.attachment && (
        <Card title='학생이 공유한 결과'>
          <Space
            orientation='vertical'
            className='w-full'>
            <Tag>
              {question.attachment.kind === 'explanation'
                ? '문맥 설명'
                : question.attachment.kind === 'practice'
                  ? '연습 문제'
                  : '선택한 AI 답변'}
              {question.attachment.version
                ? ` · v${question.attachment.version}`
                : ''}
            </Tag>
            <Typography.Paragraph
              className='mb-0!'
              style={{ whiteSpace: 'pre-wrap' }}>
              {question.attachment.text}
            </Typography.Paragraph>
          </Space>
        </Card>
      )}
      <QuestionContentPanel
        questionId={question.id}
        access={access}
      />
      <Card title='공개 대화 이력'>
        <Timeline
          items={question.messages.map((entry) => ({
            color: entry.kind === 'answer' ? 'blue' : 'gray',
            content: (
              <div>
                <Space>
                  <Typography.Text strong>
                    {entry.kind === 'answer' ? '도우미 답변' : '질문'}
                  </Typography.Text>
                  <Typography.Text type='secondary'>
                    {entry.author.name} · {formatDate(entry.createdAt)}
                  </Typography.Text>
                </Space>
                <Typography.Paragraph
                  style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                  {entry.body}
                </Typography.Paragraph>
              </div>
            ),
          }))}
        />
      </Card>
      <Modal
        title='검토 요청 작성'
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={createReview}
        confirmLoading={mutation.isPending}
        okText='요청 기록'
        cancelText='취소'
        destroyOnHidden>
        <Alert
          type='info'
          title={sourceLabel(question.source)}
          description='검토 요청 기록은 원문·설명·문제의 실제 변경을 의미하지 않습니다.'
          className='mb-5!'
        />
        <Form
          form={reviewForm}
          layout='vertical'
          initialValues={{
            scope: 'source',
            version: `v${question.source.version}`,
          }}>
          <Form.Item
            name='targetKey'
            label='공유된 결과 선택'
            extra='결과를 선택하면 실제 대상과 현재 버전을 요청에 연결합니다.'>
            <Select
              allowClear
              loading={content.isPending}
              placeholder='선택한 원문 범위'
              options={(content.data?.items ?? []).map((item) => ({
                value: `${item.kind}:${item.id}`,
                label: `${item.kind === 'explanation' ? '설명' : item.kind === 'practice' ? '문제' : '전사'} · v${item.version}`,
              }))}
              onChange={(value) => {
                const selected = content.data?.items.find(
                  (item) => `${item.kind}:${item.id}` === value
                );

                // 선택한 콘텐츠와 검토 범위·버전 표기가 서로 다른 대상을 가리키지 않게 한다.
                if (selected)
                  reviewForm.setFieldsValue({
                    scope:
                      selected.kind === 'segment'
                        ? 'source'
                        : selected.kind === 'practice'
                          ? 'question'
                          : 'explanation',
                    version: `v${selected.version}`,
                  });
              }}
            />
          </Form.Item>
          <Form.Item
            name='scope'
            label='검토 대상'
            rules={[{ required: true }]}>
            <Select
              disabled={Boolean(selectedTargetKey)}
              options={[
                { value: 'source', label: '선택한 원문' },
                { value: 'explanation', label: '설명' },
                { value: 'question', label: '문제' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name='version'
            label='대상 버전'
            rules={[
              {
                required: true,
                whitespace: true,
                message: '확인할 버전 또는 범위를 입력해 주세요.',
              },
              { max: 100 },
            ]}>
            <Input
              disabled={Boolean(selectedTargetKey)}
              placeholder='예: 원문 p.3 / 설명 v1'
              maxLength={100}
            />
          </Form.Item>
          <Form.Item
            name='reason'
            label='검토 근거와 요청 사유'
            rules={[
              {
                required: true,
                whitespace: true,
                message: '사유를 입력해 주세요.',
              },
              { max: 5000 },
            ]}>
            <Input.TextArea
              rows={4}
              maxLength={5000}
            />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}

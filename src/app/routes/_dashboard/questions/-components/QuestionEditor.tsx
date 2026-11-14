import { ListItem } from '@astryxdesign/core/List';
import { List } from '@astryxdesign/core/List';
import { useToast } from '@astryxdesign/core/Toast';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Text } from '@astryxdesign/core/Text';
import { Stack } from '@astryxdesign/core/Stack';
import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Card } from '@astryxdesign/core/Card';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Dialog } from '@astryxdesign/core/Dialog';
import Form from 'rc-field-form';
import { FormField } from '@/components/ui/FormField';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { WorkspaceAccess } from '@/domains/auth/model/contracts';
import { useQuestionMutation } from '@/domains/questions/api/questions';
import { formatDate, sourceLabel } from '@/domains/questions/lib/format';
import type { QuestionDetail } from '@/domains/questions/model/contracts';
import { QuestionStatus } from '@/domains/questions/ui/QuestionStatus';
import { SourceExcerpt } from '@/domains/questions/ui/SourceExcerpt';
import { PageHeading } from '../../-components/PageHeading';
import { contentQuery } from '@/domains/content/api/content';
import { QuestionContentPanel } from '../../-components/QuestionContentPanel';

type EditorValues = {
  draft: string;
  internalNote: string;
};
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
  const toast = useToast();
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
          toast({
            type: 'info',
            body: '게시할 답변을 작성해 주세요.',
          });

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

      toast({
        type: 'info',
        body: publish
          ? '답변을 게시했습니다.'
          : '초안과 내부 메모를 저장했습니다.',
      });
    } catch (error) {
      if (error instanceof Error)
        toast({
          type: 'error',
          body: error.message,
        });
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

      toast({
        type: 'info',
        body: '검토 요청을 기록했습니다.',
      });

      setReviewOpen(false);
      reviewForm.resetFields();
    } catch (error) {
      if (error instanceof Error)
        toast({
          type: 'error',
          body: error.message,
        });
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
          <Button
            onClick={() => void navigate({ to: '/questions' })}
            variant='secondary'
            label='질문함으로'
          />
        }
      />
      <Stack
        direction='horizontal'
        gap={2}>
        {question.kind === 'report' && (
          <Badge
            variant='red'
            label={<>학생 오류 신고</>}
          />
        )}
        {question.resolvedAt && (
          <Badge
            variant='green'
            label={<>학생이 해결 확인</>}
          />
        )}
        <Badge label={<>#{question.id.slice(0, 8)}</>} />
        <QuestionStatus status={question.status} />
        <Text color='secondary'>
          담당{' '}
          {question.assignee ? question.assignee.name || '이름 없음' : '미배정'}{' '}
          · {formatDate(question.createdAt)}
        </Text>
      </Stack>
      {question.kind !== 'report' && (
        <Banner
          status='info'
          title='기존 개인 질문은 이력으로 보존합니다. 새 학습 질문과 조교 답변은 커뮤니티에서 작성합니다.'
        />
      )}
      <div className='grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.456fr)_minmax(340px,1fr)]'>
        <Card padding={5}>
          <Heading level={3}>{'자료 신고 · 기존 질문 기록'}</Heading>
          <Stack
            className='w-full'
            direction='vertical'
            gap={2}>
            <Heading
              level={4}
              style={{ marginBottom: 0 }}>
              {question.title}
            </Heading>
            <Text
              style={{ fontSize: 12 }}
              color='secondary'>
              질문자 {question.author.name || '이름 없음'} · 운영자에게 공유
            </Text>
            <Text
              style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}
              as='p'>
              {question.body}
            </Text>
            <Form
              className='flex flex-col gap-4'
              form={form}
              initialValues={{
                draft: question.draft,
                internalNote: question.internalNote,
              }}>
              <FormField
                name='draft'
                label='학생에게 공개되는 답변'
                rules={[
                  {
                    max: 10000,
                    message: '답변은 10,000자 이내로 작성해 주세요.',
                  },
                ]}>
                <TextArea
                  rows={5}
                  maxLength={10000}
                  placeholder='원문을 바탕으로 답변을 작성해 주세요.'
                  label={'원문을 바탕으로 답변을 작성해 주세요.'}
                  isLabelHidden
                  value={''}
                />
              </FormField>
              <FormField
                name='internalNote'
                label='내부 검토 메모 · 학생에게 비공개'
                description={
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
                <TextArea
                  rows={3}
                  maxLength={10000}
                  isDisabled={!access.canReview}
                  placeholder='검토 근거와 후속 작업을 기록해 주세요.'
                  label={'검토 근거와 후속 작업을 기록해 주세요.'}
                  isLabelHidden
                  value={''}
                />
              </FormField>
              <Stack
                direction='horizontal'
                gap={2}>
                <Button
                  isLoading={mutation.isPending}
                  onClick={() => save(false)}
                  variant='secondary'
                  label='초안 저장'
                />
                <Button
                  isLoading={mutation.isPending}
                  isDisabled={question.kind !== 'report'}
                  onClick={() => save(true)}
                  variant='primary'
                  label='답변 게시'
                />
              </Stack>
            </Form>
            <Text
              style={{ fontSize: 12 }}
              color='secondary'>
              게시한 답변은 학생의 질문 상세에 표시됩니다. 내부 메모는 공개하지
              않습니다.
            </Text>
          </Stack>
        </Card>
        <div className='flex flex-col gap-5'>
          <Card padding={5}>
            <Heading level={3}>{'원문 근거'}</Heading>
            <SourceExcerpt source={question.source} />
          </Card>
          <Card padding={5}>
            <Heading level={3}>{'검토 요청'}</Heading>
            <Stack
              className='w-full'
              direction='vertical'
              gap={2}>
              <Badge
                variant='orange'
                label={<>선택한 구절 · 대상 버전</>}
              />
              <Text
                style={{ marginBottom: 0 }}
                as='p'>
                답변 게시와 설명·문제 검토 요청은 별도로 처리합니다.
              </Text>
              {question.reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: 12,
                    background: 'var(--color-background-body)',
                    borderRadius: 8,
                  }}>
                  <Stack
                    direction='horizontal'
                    gap={2}>
                    <Badge
                      label={
                        <>
                          {review.scope === 'source'
                            ? '원문'
                            : review.scope === 'explanation'
                              ? '설명'
                              : '문제'}
                        </>
                      }
                    />
                    <Text>{review.version}</Text>
                    <Badge
                      variant={review.status === 'open' ? 'orange' : 'green'}
                      label={
                        <>
                          {review.status === 'open'
                            ? '검토 중'
                            : review.status === 'resolved'
                              ? '검토 완료'
                              : '반려'}
                        </>
                      }
                    />
                  </Stack>
                  <Text
                    className='mt-2! mb-0!'
                    as='p'>
                    {review.reason}
                  </Text>
                  {review.resolution && (
                    <Text
                      className='mt-2! mb-0!'
                      as='p'
                      color='secondary'>
                      {review.resolution}
                    </Text>
                  )}
                </div>
              ))}
              <Button
                isDisabled={!access.canReview || !access.canRequestEdit}
                onClick={() => setReviewOpen(true)}
                variant='secondary'
                label='검토 요청 작성'
              />
              <Text
                style={{ fontSize: 12 }}
                color='secondary'>
                자료 전체가 아닌 지정한 구절·대상·버전에 적용됩니다. 공유된
                결과에서 실제 내용을 검토하고 새 버전을 적용할 수 있습니다.
              </Text>
            </Stack>
          </Card>
        </div>
      </div>
      {question.attachment && (
        <Card padding={5}>
          <Heading level={3}>{'학생이 공유한 결과'}</Heading>
          <Stack
            className='w-full'
            direction='vertical'
            gap={2}>
            <Badge
              label={
                <>
                  {question.attachment.kind === 'explanation'
                    ? '문맥 설명'
                    : question.attachment.kind === 'practice'
                      ? '연습 문제'
                      : '선택한 AI 답변'}
                  {question.attachment.version
                    ? ` · v${question.attachment.version}`
                    : ''}
                </>
              }
            />
            <Text
              className='mb-0!'
              style={{ whiteSpace: 'pre-wrap' }}
              as='p'>
              {question.attachment.text}
            </Text>
          </Stack>
        </Card>
      )}
      <QuestionContentPanel
        questionId={question.id}
        access={access}
      />
      <Card padding={5}>
        <Heading level={3}>{'공개 대화 이력'}</Heading>
        <List>
          {question.messages
            .map((entry) => ({
              color: entry.kind === 'answer' ? 'blue' : 'gray',
              content: (
                <div>
                  <Stack
                    direction='horizontal'
                    gap={2}>
                    <Text weight='semibold'>
                      {entry.kind === 'answer' ? '도우미 답변' : '질문'}
                    </Text>
                    <Text color='secondary'>
                      {entry.author.name} · {formatDate(entry.createdAt)}
                    </Text>
                  </Stack>
                  <Text
                    style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}
                    as='p'>
                    {entry.body}
                  </Text>
                </div>
              ),
            }))
            .map((item, index) => (
              <ListItem
                key={index}
                label={item.content}
              />
            ))}
        </List>
      </Card>
      <Dialog
        isOpen={reviewOpen}
        onOpenChange={() => setReviewOpen(false)}>
        <DialogHeader
          title={'검토 요청 작성'}
          onOpenChange={() => setReviewOpen(false)}
        />
        <Banner
          status='info'
          title={sourceLabel(question.source)}
          description='검토 요청 기록은 원문·설명·문제의 실제 변경을 의미하지 않습니다.'
          className='mb-5!'
        />
        <Form
          className='flex flex-col gap-4'
          form={reviewForm}
          initialValues={{
            scope: 'source',
            version: `v${question.source.version}`,
          }}>
          <FormField
            name='targetKey'
            label='공유된 결과 선택'
            description='결과를 선택하면 실제 대상과 현재 버전을 요청에 연결합니다.'>
            <Selector
              hasClear
              isLoading={content.isPending}
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
              label={'선택한 원문 범위'}
              isLabelHidden
              value={''}
            />
          </FormField>
          <FormField
            name='scope'
            label='검토 대상'
            rules={[{ required: true }]}>
            <Selector
              isDisabled={Boolean(selectedTargetKey)}
              options={[
                { value: 'source', label: '선택한 원문' },
                { value: 'explanation', label: '설명' },
                { value: 'question', label: '문제' },
              ]}
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
          <FormField
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
            <TextInput
              isDisabled={Boolean(selectedTargetKey)}
              placeholder='예: 원문 p.3 / 설명 v1'
              label={'예: 원문 p.3 / 설명 v1'}
              isLabelHidden
              value={''}
            />
          </FormField>
          <FormField
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
            <TextArea
              rows={4}
              maxLength={5000}
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
        </Form>
        <Button
          label={'요청 기록'}
          variant='primary'
          onClick={createReview}
          isLoading={mutation.isPending}
        />
      </Dialog>
    </section>
  );
}

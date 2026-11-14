import { useToast } from '@astryxdesign/core/Toast';
import { Banner } from '@astryxdesign/core/Banner';
import { Badge } from '@astryxdesign/core/Badge';
import { Text } from '@astryxdesign/core/Text';
import { Stack } from '@astryxdesign/core/Stack';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Spinner } from '@astryxdesign/core/Spinner';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Dialog } from '@astryxdesign/core/Dialog';
import Form from 'rc-field-form';
import { FormField } from '@/components/ui/FormField';
import { DataTable } from '@/components/ui/DataTable';
import { aiProviderLabel } from '@/domains/operations/lib/providerLabel';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { WorkspaceAccess } from '@/domains/auth/model/contracts';
import {
  contentImpactQuery,
  useContentMutation,
  versionsQuery,
} from '@/domains/content/api/content';
import type { Content } from '@/domains/content/model/contracts';
import { SourceExcerpt } from '@/domains/questions/ui/SourceExcerpt';
import { ContentPayloadFields } from './ContentPayloadFields';
import { ContentVersionHistory } from './ContentVersionHistory';
import {
  contentEditorPayload,
  contentEditorValues,
  type ContentEditorValues,
} from './contentForm';

const kindLabel = {
  explanation: '설명',
  practice: '문제',
  segment: '영상 전사',
};

/** 새 버전 적용과 범위별 검토를 실제 저장 요청과 버전 충돌 검사에 연결한다. */
export function ContentEditor({
  questionId,
  content,
  access,
  onClose,
}: {
  questionId: string;
  content: Content;
  access: WorkspaceAccess;
  onClose: () => void;
}) {
  const [form] = Form.useForm<ContentEditorValues>();
  const mutation = useContentMutation(questionId, content);
  const versions = useQuery(versionsQuery(questionId, content));
  const impact = useQuery(contentImpactQuery(questionId, content));
  const toast = useToast();

  const editable =
    access.role === 'admin' || (access.canEdit && access.canReview);

  const [payloadDirty, setPayloadDirty] = useState(false);

  async function apply(
    action: 'revisions' | 'verified' | 'needs_review' | 'visibility'
  ) {
    if (mutation.isPending) return;

    try {
      // 검토·노출 조치는 미저장 본문을 새 버전으로 잘못 적용하지 않는다.
      const values = await form.validateFields(
        action === 'revisions' ? undefined : ['reason']
      );

      const reason = values.reason.trim();

      if (action === 'revisions')
        await mutation.mutateAsync({
          action,
          reason,
          payload: contentEditorPayload(content, values),
        });
      else if (action === 'visibility')
        await mutation.mutateAsync({
          action,
          reason,
          visible: content.status === 'suspended',
        });
      else
        await mutation.mutateAsync({
          action: 'review',
          reason,
          status: action,
        });

      toast({
        type: 'info',
        body:
          action === 'revisions'
            ? '새 버전을 적용했습니다. 과거 답안은 당시 버전으로 보존됩니다.'
            : action === 'visibility'
              ? '문제의 새 풀이 노출 상태를 변경했습니다.'
              : `현재 v${content.version}의 검토 상태를 기록했습니다.`,
      });

      onClose();
    } catch (error) {
      if (error instanceof Error)
        toast({
          type: 'error',
          body: error.message,
        });
    }
  }

  return (
    <Dialog
      isOpen
      width={1120}
      onOpenChange={() => {
        if (!mutation.isPending) onClose();
      }}>
      <DialogHeader
        title={`${kindLabel[content.kind]} 검토 · 수정 · v${content.version}`}
        onOpenChange={() => {
          if (!mutation.isPending) onClose();
        }}
      />
      <div className='flex flex-col gap-5'>
        <Banner
          status='info'
          title='확인한 대상과 버전에만 적용합니다.'
          description='새 버전은 이전 내용·정답·해설을 덮어쓰지 않습니다. 연결된 문제와 검토에는 재확인 상태가 표시됩니다.'
        />
        <SourceExcerpt source={content.source} />
        <Stack
          direction='horizontal'
          gap={2}>
          <Badge
            variant={content.status === 'suspended' ? 'red' : 'blue'}
            label={
              <>
                {content.status === 'suspended' ? '새 풀이 중단' : '이용 가능'}
              </>
            }
          />
          <Text color='secondary'>
            {aiProviderLabel(content.provider)} · {content.model}
          </Text>
          <Badge
            variant={
              !content.needsReview && content.reviewStatus === 'verified'
                ? 'green'
                : 'orange'
            }
            label={
              <>
                {content.needsReview || content.reviewStatus === 'needs_review'
                  ? '재확인 필요'
                  : content.reviewStatus === 'verified'
                    ? `검토 완료 · v${content.version}`
                    : '미검토'}
              </>
            }
          />
        </Stack>
        <fieldset
          disabled={mutation.isPending}
          className='m-0 min-w-0 border-0 p-0'>
          <Form
            className='flex flex-col gap-4'
            form={form}
            initialValues={contentEditorValues(content)}
            onValuesChange={(changed) => {
              if (Object.keys(changed).some((key) => key !== 'reason'))
                setPayloadDirty(true);
            }}>
            <div className='grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]'>
              <div>
                <fieldset disabled={!editable || mutation.isPending}>
                  <ContentPayloadFields
                    content={content}
                    form={form}
                  />
                </fieldset>
                <Text
                  as='p'
                  color='secondary'>
                  내용 수정은 직접 수정 권한이 있는 도우미 또는 운영자만
                  적용합니다.
                </Text>
              </div>
              <div className='sticky top-4'>
                <FormField
                  name='reason'
                  label='변경 · 검토 사유'
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: '원문 근거와 변경 또는 검토 사유를 남겨 주세요.',
                    },
                    { max: 5000 },
                  ]}>
                  <TextArea
                    rows={6}
                    maxLength={5000}
                    placeholder='확인한 근거와 조치 이유'
                    label={'확인한 근거와 조치 이유'}
                    isLabelHidden
                    value={''}
                  />
                </FormField>
                <Stack
                  className='w-full'
                  direction='vertical'
                  gap={2}>
                  <Button
                    isDisabled={!editable}
                    isLoading={mutation.isPending}
                    onClick={() => void apply('revisions')}
                    variant='primary'
                    width='100%'
                    label='새 버전 적용'
                  />
                  <Button
                    isDisabled={!access.canReview || payloadDirty}
                    isLoading={mutation.isPending}
                    onClick={() => void apply('verified')}
                    variant='secondary'
                    width='100%'
                    label='이 버전 검토 완료'
                  />
                  <Button
                    isDisabled={!access.canReview || payloadDirty}
                    onClick={() => void apply('needs_review')}
                    variant='secondary'
                    width='100%'
                    label='수정 · 재확인 필요'
                  />
                  {content.kind === 'practice' && (
                    <Button
                      isDisabled={!editable}
                      onClick={() => void apply('visibility')}
                      variant={
                        content.status !== 'suspended'
                          ? 'destructive'
                          : 'secondary'
                      }
                      width='100%'
                      label={
                        content.status === 'suspended'
                          ? '새 풀이 다시 허용'
                          : '새 풀이 노출 중단'
                      }
                    />
                  )}
                </Stack>
                {payloadDirty && (
                  <Banner
                    className='mt-3!'
                    status='warning'
                    title='아직 적용하지 않은 수정 내용이 있습니다.'
                    description='새 버전을 적용하거나 저장된 내용으로 되돌린 뒤 해당 버전을 검토해 주세요.'
                    endContent={
                      <Button
                        onClick={() => {
                          const reason = form.getFieldValue('reason');

                          form.setFieldsValue({
                            ...contentEditorValues(content),
                            reason,
                          });

                          setPayloadDirty(false);
                        }}
                        variant='secondary'
                        label='되돌리기'
                      />
                    }
                  />
                )}
                {!editable && (
                  <Text
                    className='mt-3!'
                    as='p'
                    color='secondary'>
                    직접 수정 권한이 없어 새 버전 적용은 사용할 수 없습니다.
                  </Text>
                )}
              </div>
            </div>
          </Form>
        </fieldset>
        <Divider className='my-0!' />
        <Heading level={5}>영향받는 문제와 검토</Heading>
        {impact.error ? (
          <Banner
            status='error'
            title={impact.error.message}
          />
        ) : impact.isPending ? (
          <Spinner label='불러오는 중' />
        ) : (
          <>
            <Text
              className='mb-0!'
              as='p'>
              보존되는 과거 답안 {impact.data?.attemptCount ?? 0}개. 개인 답안
              본문은 표시하지 않습니다.
            </Text>
            <DataTable
              size='small'
              rowKey={(item) => `${item.kind}:${item.id}`}
              dataSource={impact.data?.items ?? []}
              pagination={false}
              columns={[
                {
                  title: '종류',
                  dataIndex: 'kind',
                  render: (kind) =>
                    kindLabel[kind as keyof typeof kindLabel] || kind,
                },
                {
                  title: '버전',
                  dataIndex: 'version',
                  render: (version) => `v${version}`,
                },
                { title: '상태', dataIndex: 'status' },
                {
                  title: '검토',
                  key: 'review',
                  render: (_, item) =>
                    item.needsReview || item.reviewStatus === 'needs_review' ? (
                      <Badge
                        variant='orange'
                        label={<>재확인 필요</>}
                      />
                    ) : item.reviewStatus === 'verified' ? (
                      <Badge
                        variant='green'
                        label={<>검토 완료</>}
                      />
                    ) : (
                      <Badge label={<>미검토</>} />
                    ),
                },
              ]}
            />
          </>
        )}
        <Divider className='my-0!' />
        <Heading level={5}>수정 전후 비교</Heading>
        {versions.error ? (
          <Banner
            status='error'
            title={versions.error.message}
          />
        ) : versions.isPending ? (
          <Spinner label='불러오는 중' />
        ) : (
          <ContentVersionHistory
            content={content}
            revisions={versions.data?.items ?? []}
          />
        )}
      </div>
    </Dialog>
  );
}

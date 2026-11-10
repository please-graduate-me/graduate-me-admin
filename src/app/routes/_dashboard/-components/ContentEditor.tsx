import { aiProviderLabel } from '@/domains/operations/lib/providerLabel';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  ConfigProvider,
  Divider,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
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
  const { message } = App.useApp();

  const editable =
    access.role === 'admin' || (access.canEdit && access.canReview);

  const [payloadDirty, setPayloadDirty] = useState(false);

  async function apply(
    action: 'revisions' | 'verified' | 'needs_review' | 'visibility'
  ) {
    if (mutation.isPending) return;

    try {
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

      message.success(
        action === 'revisions'
          ? '새 버전을 적용했습니다. 과거 답안은 당시 버전으로 보존됩니다.'
          : action === 'visibility'
            ? '문제의 새 풀이 노출 상태를 변경했습니다.'
            : `현재 v${content.version}의 검토 상태를 기록했습니다.`
      );

      onClose();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  }

  return (
    <Modal
      open
      width={1120}
      title={`${kindLabel[content.kind]} 검토 · 수정 · v${content.version}`}
      onCancel={() => {
        if (!mutation.isPending) onClose();
      }}
      footer={null}
      closable={!mutation.isPending}>
      <div className='flex flex-col gap-5'>
        <Alert
          type='info'
          title='확인한 대상과 버전에만 적용합니다.'
          description='새 버전은 이전 내용·정답·해설을 덮어쓰지 않습니다. 연결된 문제와 검토에는 재확인 상태가 표시됩니다.'
        />
        <SourceExcerpt source={content.source} />
        <Space>
          <Tag color={content.status === 'suspended' ? 'red' : 'blue'}>
            {content.status === 'suspended' ? '새 풀이 중단' : '이용 가능'}
          </Tag>
          <Typography.Text type='secondary'>
            {aiProviderLabel(content.provider)} · {content.model}
          </Typography.Text>
          <Tag
            color={
              !content.needsReview && content.reviewStatus === 'verified'
                ? 'green'
                : 'orange'
            }>
            {content.needsReview || content.reviewStatus === 'needs_review'
              ? '재확인 필요'
              : content.reviewStatus === 'verified'
                ? `검토 완료 · v${content.version}`
                : '미검토'}
          </Tag>
        </Space>
        <Form
          form={form}
          layout='vertical'
          initialValues={contentEditorValues(content)}
          onValuesChange={(changed) => {
            if (Object.keys(changed).some((key) => key !== 'reason'))
              setPayloadDirty(true);
          }}
          disabled={mutation.isPending}>
          <div className='grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6'>
            <div>
              <ConfigProvider
                componentDisabled={!editable || mutation.isPending}>
                <ContentPayloadFields
                  content={content}
                  form={form}
                />
              </ConfigProvider>
              <Typography.Paragraph type='secondary'>
                내용 수정은 직접 수정 권한이 있는 도우미 또는 운영자만
                적용합니다.
              </Typography.Paragraph>
            </div>
            <div className='sticky top-4'>
              <Form.Item
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
                <Input.TextArea
                  rows={6}
                  maxLength={5000}
                  placeholder='확인한 근거와 조치 이유'
                />
              </Form.Item>
              <Space
                orientation='vertical'
                className='w-full'>
                <Button
                  type='primary'
                  block
                  disabled={!editable}
                  loading={mutation.isPending}
                  onClick={() => void apply('revisions')}>
                  새 버전 적용
                </Button>
                <Button
                  block
                  disabled={!access.canReview || payloadDirty}
                  loading={mutation.isPending}
                  onClick={() => void apply('verified')}>
                  이 버전 검토 완료
                </Button>
                <Button
                  block
                  disabled={!access.canReview || payloadDirty}
                  onClick={() => void apply('needs_review')}>
                  수정 · 재확인 필요
                </Button>
                {content.kind === 'practice' && (
                  <Button
                    danger={content.status !== 'suspended'}
                    block
                    disabled={!editable}
                    onClick={() => void apply('visibility')}>
                    {content.status === 'suspended'
                      ? '새 풀이 다시 허용'
                      : '새 풀이 노출 중단'}
                  </Button>
                )}
              </Space>
              {payloadDirty && (
                <Alert
                  className='mt-3!'
                  type='warning'
                  title='아직 적용하지 않은 수정 내용이 있습니다.'
                  description='새 버전을 적용하거나 저장된 내용으로 되돌린 뒤 해당 버전을 검토해 주세요.'
                  action={
                    <Button
                      onClick={() => {
                        const reason = form.getFieldValue('reason');

                        form.setFieldsValue({
                          ...contentEditorValues(content),
                          reason,
                        });

                        setPayloadDirty(false);
                      }}>
                      되돌리기
                    </Button>
                  }
                />
              )}
              {!editable && (
                <Typography.Paragraph
                  type='secondary'
                  className='mt-3!'>
                  직접 수정 권한이 없어 새 버전 적용은 사용할 수 없습니다.
                </Typography.Paragraph>
              )}
            </div>
          </div>
        </Form>
        <Divider className='my-0!' />
        <Typography.Title level={5}>영향받는 문제와 검토</Typography.Title>
        {impact.error ? (
          <Alert
            type='error'
            title={impact.error.message}
          />
        ) : impact.isPending ? (
          <Spin />
        ) : (
          <>
            <Typography.Paragraph className='mb-0!'>
              보존되는 과거 답안 {impact.data?.attemptCount ?? 0}개. 개인 답안
              본문은 표시하지 않습니다.
            </Typography.Paragraph>
            <Table
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
                      <Tag color='orange'>재확인 필요</Tag>
                    ) : item.reviewStatus === 'verified' ? (
                      <Tag color='green'>검토 완료</Tag>
                    ) : (
                      <Tag>미검토</Tag>
                    ),
                },
              ]}
            />
          </>
        )}
        <Divider className='my-0!' />
        <Typography.Title level={5}>수정 전후 비교</Typography.Title>
        {versions.error ? (
          <Alert
            type='error'
            title={versions.error.message}
          />
        ) : versions.isPending ? (
          <Spin />
        ) : (
          <ContentVersionHistory
            content={content}
            revisions={versions.data?.items ?? []}
          />
        )}
      </div>
    </Modal>
  );
}

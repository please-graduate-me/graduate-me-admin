import { useToast } from '@astryxdesign/core/Toast';
import { Switch } from '@astryxdesign/core/Switch';
import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Button } from '@astryxdesign/core/Button';
import { Dialog } from '@astryxdesign/core/Dialog';
import Form from 'rc-field-form';
import { FormField } from '@/components/ui/FormField';
import { useModerateCommunity } from '@/domains/operations/api/moderation';
import type { CommunityReport } from '@/domains/operations/model/moderation';
import { SourceExcerpt } from '@/domains/questions/ui/SourceExcerpt';

/** 신고 게시물의 숨김과 복원을 삭제 없이 운영 조치·감사 이력으로 남긴다. */
export function CommunityReportEditor({
  report,
  onClose,
}: {
  report: CommunityReport;
  onClose: () => void;
}) {
  const [form] = Form.useForm<{
    status: 'resolved' | 'dismissed';
    resolution: string;
    hidden: boolean;
  }>();

  const mutation = useModerateCommunity();
  const toast = useToast();

  return (
    <Dialog
      isOpen
      width={880}
      onOpenChange={onClose}>
      <DialogHeader
        title={'게시물 신고 검토'}
        onOpenChange={onClose}
      />
      <div className='grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6'>
        <div className='flex flex-col gap-4'>
          <Banner
            status='warning'
            title='신고 사유'
            description={report.reason}
          />
          <Heading level={4}>{report.post.title}</Heading>
          <Text
            style={{ whiteSpace: 'pre-wrap' }}
            as='p'>
            {report.post.body}
          </Text>
          {report.post.source && <SourceExcerpt source={report.post.source} />}
          <Text color='secondary'>
            신고자가 접근할 수 있었던 게시 내용과 선택 발췌만 표시합니다. 원본
            자료 권한이나 학생 개인 기록은 공개되지 않습니다.
          </Text>
        </div>
        <Form
          form={form}
          initialValues={{
            status: report.status === 'dismissed' ? 'dismissed' : 'resolved',
            resolution: report.resolution ?? '',
            hidden: Boolean(report.post.hiddenAt),
          }}>
          <FormField
            name='status'
            label='신고 처리'
            rules={[{ required: true }]}>
            <Selector
              options={[
                { value: 'resolved', label: '조치 완료' },
                { value: 'dismissed', label: '신고 반려' },
              ]}
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
          <FormField
            name='hidden'
            label='게시물 숨김'
            description='숨김을 끄면 기존 공개 대상에게 다시 표시합니다. 작성자는 숨긴 게시물을 확인할 수 있습니다.'>
            <Switch
              label={'게시물 숨김'}
              value={false}
              onChange={() => {}}
            />
          </FormField>
          <FormField
            name='resolution'
            label='조치 사유'
            rules={[{ required: true, whitespace: true, max: 5000 }]}>
            <TextArea
              rows={6}
              maxLength={5000}
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
          <Banner
            status='info'
            title='원문은 보존합니다.'
            description='숨김·복원과 신고 상태 변경은 운영 이력에 기록합니다. 댓글·추천·개인 학습 자료를 삭제하지 않습니다.'
          />
        </Form>
      </div>
      <Button
        label={'조치 적용'}
        variant='primary'
        onClick={async () => {
          try {
            const values = await form.validateFields();

            await mutation.mutateAsync({
              id: report.id,
              expectedUpdatedAt: report.updatedAt,
              ...values,
            });

            toast({
              type: 'info',
              body: '게시물 상태와 조치 사유를 저장했습니다.',
            });

            onClose();
          } catch (error) {
            if (error instanceof Error)
              toast({ type: 'error', body: error.message });
          }
        }}
        isLoading={mutation.isPending}
      />
    </Dialog>
  );
}

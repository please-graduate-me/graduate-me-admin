import {
  Alert,
  App,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Typography,
} from 'antd';
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
  const { message } = App.useApp();

  return (
    <Modal
      open
      width={880}
      title='게시물 신고 검토'
      okText='조치 적용'
      cancelText='취소'
      confirmLoading={mutation.isPending}
      onCancel={onClose}
      onOk={async () => {
        try {
          const values = await form.validateFields();

          await mutation.mutateAsync({
            id: report.id,
            expectedUpdatedAt: report.updatedAt,
            ...values,
          });

          message.success('게시물 상태와 조치 사유를 저장했습니다.');
          onClose();
        } catch (error) {
          if (error instanceof Error) message.error(error.message);
        }
      }}>
      <div className='grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6'>
        <div className='flex flex-col gap-4'>
          <Alert
            type='warning'
            title='신고 사유'
            description={report.reason}
          />
          <Typography.Title level={4}>{report.post.title}</Typography.Title>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {report.post.body}
          </Typography.Paragraph>
          {report.post.source && <SourceExcerpt source={report.post.source} />}
          <Typography.Text type='secondary'>
            신고자가 접근할 수 있었던 게시 내용과 선택 발췌만 표시합니다. 원본
            자료 권한이나 학생 개인 기록은 공개되지 않습니다.
          </Typography.Text>
        </div>
        <Form
          form={form}
          layout='vertical'
          initialValues={{
            status: report.status === 'dismissed' ? 'dismissed' : 'resolved',
            resolution: report.resolution ?? '',
            hidden: Boolean(report.post.hiddenAt),
          }}>
          <Form.Item
            name='status'
            label='신고 처리'
            rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'resolved', label: '조치 완료' },
                { value: 'dismissed', label: '신고 반려' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name='hidden'
            label='게시물 숨김'
            valuePropName='checked'
            extra='숨김을 끄면 기존 공개 대상에게 다시 표시합니다. 작성자는 숨긴 게시물을 확인할 수 있습니다.'>
            <Switch />
          </Form.Item>
          <Form.Item
            name='resolution'
            label='조치 사유'
            rules={[{ required: true, whitespace: true, max: 5000 }]}>
            <Input.TextArea
              rows={6}
              maxLength={5000}
            />
          </Form.Item>
          <Alert
            type='info'
            title='원문은 보존합니다.'
            description='숨김·복원과 신고 상태 변경은 운영 이력에 기록합니다. 댓글·추천·개인 학습 자료를 삭제하지 않습니다.'
          />
        </Form>
      </div>
    </Modal>
  );
}

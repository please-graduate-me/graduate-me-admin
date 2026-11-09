import { App, Button, Card, Form, Input, Select, Typography } from 'antd';
import { useResolveReview } from '@/domains/questions/api/questions';
import type { ReviewRequest } from '@/domains/questions/model/contracts';

/** 확인한 근거에 대한 운영 상태와 사유만 저장한다. */
export function ReviewDecision({ review }: { review: ReviewRequest }) {
  const [form] = Form.useForm<{
    status: 'resolved' | 'dismissed';
    resolution: string;
  }>();

  const mutation = useResolveReview();
  const { message } = App.useApp();

  async function submit() {
    try {
      const values = await form.validateFields();

      await mutation.mutateAsync({ id: review.id, ...values });
      message.success('검토 조치 기록을 저장했습니다.');
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  }

  return (
    <Card title='운영 조치 기록'>
      <Form
        form={form}
        layout='vertical'
        initialValues={{
          status: review.status === 'dismissed' ? 'dismissed' : 'resolved',
          resolution: review.resolution || '',
        }}>
        <Form.Item
          name='status'
          label='처리 상태'
          rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'resolved', label: '검토 완료' },
              { value: 'dismissed', label: '반려' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name='resolution'
          label='조치 사유'
          rules={[
            {
              required: true,
              whitespace: true,
              message: '확인한 내용과 조치 사유를 입력해 주세요.',
            },
            { max: 5000 },
          ]}>
          <Input.TextArea
            rows={5}
            maxLength={5000}
          />
        </Form.Item>
        <Typography.Paragraph type='secondary'>
          검토 조치 기록은 admin 내부 이력에 남습니다.
        </Typography.Paragraph>
        <Button
          type='primary'
          loading={mutation.isPending}
          onClick={submit}>
          {review.status === 'open' ? '조치 기록 저장' : '조치 기록 갱신'}
        </Button>
      </Form>
    </Card>
  );
}

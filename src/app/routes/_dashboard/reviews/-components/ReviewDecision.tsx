import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
} from 'antd';
import { useResolveReview } from '@/domains/questions/api/questions';
import type { ReviewRequest } from '@/domains/questions/model/contracts';

/** 학생 신고와 도우미 요청의 처리 상태를 실제 콘텐츠 조치와 구분해 저장한다. */
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
        disabled={review.status !== 'open' || mutation.isPending}
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
        {review.status !== 'open' && (
          <Alert
            className='mb-4!'
            type='success'
            title='이미 처리된 요청입니다.'
            description={review.resolution || undefined}
          />
        )}
        <Button
          type='primary'
          loading={mutation.isPending}
          disabled={review.status !== 'open'}
          onClick={submit}>
          {review.status === 'open' ? '조치 기록 저장' : '처리 완료'}
        </Button>
      </Form>
    </Card>
  );
}

import { useToast } from '@astryxdesign/core/Toast';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Text } from '@astryxdesign/core/Text';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { Card } from '@astryxdesign/core/Card';
import Form from 'rc-field-form';
import { FormField } from '@/components/ui/FormField';
import { useResolveReview } from '@/domains/questions/api/questions';
import type { ReviewRequest } from '@/domains/questions/model/contracts';

/** 학생 신고와 도우미 요청의 처리 상태를 실제 콘텐츠 조치와 구분해 저장한다. */
export function ReviewDecision({ review }: { review: ReviewRequest }) {
  const [form] = Form.useForm<{
    status: 'resolved' | 'dismissed';
    resolution: string;
  }>();

  const mutation = useResolveReview();
  const toast = useToast();

  async function submit() {
    try {
      const values = await form.validateFields();

      await mutation.mutateAsync({ id: review.id, ...values });

      toast({
        type: 'info',
        body: '검토 조치 기록을 저장했습니다.',
      });
    } catch (error) {
      if (error instanceof Error)
        toast({
          type: 'error',
          body: error.message,
        });
    }
  }

  return (
    <Card padding={5}>
      <Heading level={3}>{'운영 조치 기록'}</Heading>
      <fieldset
        disabled={review.status !== 'open' || mutation.isPending}
        className='m-0 min-w-0 border-0 p-0'>
        <Form
          form={form}
          initialValues={{
            status: review.status === 'dismissed' ? 'dismissed' : 'resolved',
            resolution: review.resolution || '',
          }}>
          <FormField
            name='status'
            label='처리 상태'
            rules={[{ required: true }]}>
            <Selector
              options={[
                { value: 'resolved', label: '검토 완료' },
                { value: 'dismissed', label: '반려' },
              ]}
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
          <FormField
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
            <TextArea
              rows={5}
              maxLength={5000}
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
          <Text
            as='p'
            color='secondary'>
            검토 조치 기록은 admin 내부 이력에 남습니다.
          </Text>
          {review.status !== 'open' && (
            <Banner
              className='mb-4!'
              status='success'
              title='이미 처리된 요청입니다.'
              description={review.resolution || undefined}
            />
          )}
          <Button
            isLoading={mutation.isPending}
            isDisabled={review.status !== 'open'}
            onClick={submit}
            variant='primary'
            label={review.status === 'open' ? '조치 기록 저장' : '처리 완료'}
          />
        </Form>
      </fieldset>
    </Card>
  );
}

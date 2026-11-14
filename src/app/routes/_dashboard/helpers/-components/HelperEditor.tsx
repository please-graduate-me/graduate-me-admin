import { useToast } from '@astryxdesign/core/Toast';
import { Banner } from '@astryxdesign/core/Banner';
import { TextInput } from '@astryxdesign/core/TextInput';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Button } from '@astryxdesign/core/Button';
import { Dialog } from '@astryxdesign/core/Dialog';
import Form from 'rc-field-form';
import { FormField } from '@/components/ui/FormField';
import { useSaveHelper } from '@/domains/operations/api/operations';
import type { Helper, HelperInput } from '@/domains/operations/model/contracts';

/** 조교 타이틀만 부여하며 자료 열람이나 운영 권한은 추가하지 않는다. */
export function HelperEditor({
  helper,
  onClose,
}: {
  helper: Helper | null;
  onClose: () => void;
}) {
  const [form] = Form.useForm<HelperInput>();
  const mutation = useSaveHelper();
  const toast = useToast();

  async function save() {
    try {
      await mutation.mutateAsync(await form.validateFields());

      toast({
        type: 'info',
        body: '조교 자격을 저장했습니다.',
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
      onOpenChange={onClose}>
      <DialogHeader
        title={helper ? '조교 자격 편집' : '조교 등록'}
        onOpenChange={onClose}
      />
      <Banner
        status='info'
        title='서비스에 Google 로그인한 계정에 조교 타이틀을 부여합니다.'
        description='조교는 서비스 웹에서 일반 사용자와 함께 활동하며, 자신이 태그된 커뮤니티 글을 모아볼 수 있습니다.'
        className='mb-5!'
      />
      <Form
        form={form}
        initialValues={helper ?? { email: '', active: true }}>
        <FormField
          name='email'
          label='사용자 이메일'
          rules={[
            {
              required: true,
              type: 'email',
              message: '가입한 계정의 이메일을 입력해 주세요.',
            },
          ]}>
          <TextInput
            type='email'
            autoComplete='off'
            isDisabled={Boolean(helper)}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField name='active'>
          <CheckboxInput
            label='조교 자격 활성화'
            value={false}
          />
        </FormField>
      </Form>
      <Button
        label={'저장'}
        variant='primary'
        onClick={save}
        isLoading={mutation.isPending}
      />
    </Dialog>
  );
}

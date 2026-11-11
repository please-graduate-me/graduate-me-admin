import { Alert, App, Checkbox, Form, Input, Modal } from 'antd';
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
  const { message } = App.useApp();

  async function save() {
    try {
      await mutation.mutateAsync(await form.validateFields());
      message.success('조교 자격을 저장했습니다.');
      onClose();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  }

  return (
    <Modal
      title={helper ? '조교 자격 편집' : '조교 등록'}
      open
      onCancel={onClose}
      onOk={save}
      okText='저장'
      cancelText='취소'
      confirmLoading={mutation.isPending}>
      <Alert
        type='info'
        title='서비스에 Google 로그인한 계정에 조교 타이틀을 부여합니다.'
        description='조교는 서비스 웹에서 일반 사용자와 함께 활동하며, 자신이 태그된 커뮤니티 글을 모아볼 수 있습니다.'
        className='mb-5!'
      />
      <Form
        form={form}
        layout='vertical'
        initialValues={helper ?? { email: '', active: true }}>
        <Form.Item
          name='email'
          label='사용자 이메일'
          rules={[
            {
              required: true,
              type: 'email',
              message: '가입한 계정의 이메일을 입력해 주세요.',
            },
          ]}>
          <Input
            type='email'
            autoComplete='off'
            disabled={Boolean(helper)}
          />
        </Form.Item>
        <Form.Item
          name='active'
          valuePropName='checked'>
          <Checkbox>조교 자격 활성화</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}

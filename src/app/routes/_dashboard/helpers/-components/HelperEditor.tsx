import { Alert, App, Checkbox, Form, Input, Modal, Select } from 'antd';
import { useSaveHelper } from '@/domains/operations/api/operations';
import type {
  AdminMaterial,
  Helper,
  HelperInput,
} from '@/domains/operations/model/contracts';

/** 기존 로그인 계정에 명시적인 자료 배정과 작업 권한을 저장한다. */
export function HelperEditor({
  helper,
  materials,
  materialsLoading,
  materialsError,
  onClose,
}: {
  helper: Helper | null;
  materials: AdminMaterial[];
  materialsLoading: boolean;
  materialsError: Error | null;
  onClose: () => void;
}) {
  const [form] = Form.useForm<HelperInput>();
  const mutation = useSaveHelper();
  const { message } = App.useApp();

  async function save() {
    try {
      const values = await form.validateFields();

      await mutation.mutateAsync(values);
      message.success('도우미 배정과 권한을 저장했습니다.');
      onClose();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  }

  return (
    <Modal
      title={helper ? '도우미 배정 · 권한 편집' : '학과 답변 도우미 등록'}
      open
      onCancel={onClose}
      onOk={save}
      okText='권한 저장'
      cancelText='취소'
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: Boolean(helper && !helper.email) }}
      width={640}>
      <Alert
        type='info'
        title='이미 Google 로그인을 완료한 계정만 등록할 수 있습니다.'
        description='배정 자료가 없으면 비공개 자료나 질문에 접근할 수 없습니다.'
        className='mb-5!'
      />
      {helper && !helper.email && (
        <Alert
          type='warning'
          title='계정 이메일이 없어 이 도우미를 편집할 수 없습니다.'
          description='계정 정보를 복구한 뒤 다시 시도해 주세요.'
          className='mb-5!'
        />
      )}
      {materialsError && (
        <Alert
          type='error'
          title={materialsError.message}
          className='mb-5!'
        />
      )}
      <Form
        form={form}
        layout='vertical'
        initialValues={
          helper || {
            email: '',
            languages: [],
            materialIds: [],
            canReview: true,
            canRequestEdit: false,
            canEdit: false,
            active: true,
          }
        }>
        <Form.Item
          name='email'
          label='계정 이메일'
          normalize={(value: string) => value.trim()}
          rules={[
            {
              required: true,
              message: '로그인 계정의 이메일을 입력해 주세요.',
            },
            { type: 'email', message: '이메일 주소를 확인해 주세요.' },
          ]}>
          <Input
            type='email'
            disabled={Boolean(helper)}
            autoComplete='off'
          />
        </Form.Item>
        <Form.Item
          name='languages'
          label='담당 언어'
          extra='담당 언어가 없으면 질문에 접근할 수 없습니다.'>
          <Checkbox.Group
            options={[
              { label: '영어', value: 'en' },
              { label: '태국어', value: 'th' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name='materialIds'
          label='배정 자료'
          extra='빈 목록은 접근 가능한 자료가 없다는 뜻입니다.'>
          <Select
            mode='multiple'
            allowClear
            loading={materialsLoading}
            showSearch
            optionFilterProp='label'
            options={materials.map((material) => ({
              value: material.id,
              label: `${material.kind === 'pdf' ? 'PDF' : '영상'} · ${material.title}`,
            }))}
            placeholder='답변을 담당할 자료를 선택해 주세요.'
          />
        </Form.Item>
        <Form.Item
          name='canReview'
          valuePropName='checked'>
          <Checkbox>근거 검토 · 내부 메모 작성</Checkbox>
        </Form.Item>
        <Form.Item
          name='canRequestEdit'
          valuePropName='checked'
          dependencies={['canReview']}
          rules={[
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                value && !getFieldValue('canReview')
                  ? Promise.reject(
                      new Error('수정 요청에는 검토 권한도 필요합니다.')
                    )
                  : Promise.resolve(),
            }),
          ]}
          extra='수정 요청 작성에는 검토 권한도 함께 필요합니다.'>
          <Checkbox>수정 요청 작성</Checkbox>
        </Form.Item>
        <Form.Item
          name='canEdit'
          valuePropName='checked'
          dependencies={['canReview']}
          rules={[
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                value && !getFieldValue('canReview')
                  ? Promise.reject(
                      new Error('직접 수정에는 검토 권한도 필요합니다.')
                    )
                  : Promise.resolve(),
            }),
          ]}
          extra='배정 자료의 원문·설명·문제를 새 버전으로 수정할 수 있습니다. 수정 이유와 이전 버전이 보존됩니다.'>
          <Checkbox>새 버전 직접 수정 적용</Checkbox>
        </Form.Item>
        <Form.Item
          name='active'
          valuePropName='checked'>
          <Checkbox>도우미 계정 활성화</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}

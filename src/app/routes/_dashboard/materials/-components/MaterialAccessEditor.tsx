import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Checkbox,
  Form,
  Modal,
  Select,
  Spin,
  Typography,
} from 'antd';
import {
  materialAccessQuery,
  useSaveMaterialAccess,
} from '@/domains/operations/api/operations';
import type {
  AdminMaterial,
  MaterialAccess,
} from '@/domains/operations/model/contracts';

/** 학생 개인 원본과 공용 자료의 공개·계정별 접근 범위를 실제로 적용한다. */
export function MaterialAccessEditor({
  material,
  userId,
  onClose,
}: {
  material: AdminMaterial;
  userId: string;
  onClose: () => void;
}) {
  const query = useQuery(materialAccessQuery(material.kind, material.id));

  const [form] = Form.useForm<
    Pick<MaterialAccess, 'visibility' | 'allowedUserIds'> & {
      confirmed: boolean;
    }
  >();

  const mutation = useSaveMaterialAccess(material.id);
  const { message } = App.useApp();

  const canPublish =
    query.data?.ownerId === userId || query.data?.visibility === 'public';

  const visibility = Form.useWatch('visibility', form);

  async function save() {
    if (mutation.isPending || !query.data || !canPublish) return;

    try {
      const values = await form.validateFields();

      await mutation.mutateAsync({
        kind: material.kind,
        visibility: values.visibility,
        // 특정 계정 공개를 해제할 때 이전 허용 목록이 뒤에 남지 않게 한다.
        allowedUserIds:
          values.visibility === 'accounts' ? values.allowedUserIds : [],
      });

      message.success('자료의 원본 접근 범위를 저장했습니다.');
      onClose();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  }

  return (
    <Modal
      open
      title='자료 원본 접근 범위'
      onCancel={() => {
        if (!mutation.isPending) onClose();
      }}
      onOk={save}
      okText='접근 범위 저장'
      cancelText='취소'
      okButtonProps={{ disabled: !query.data || !canPublish }}
      confirmLoading={mutation.isPending}
      width={680}>
      <Typography.Paragraph strong>{material.title}</Typography.Paragraph>
      <Alert
        className='mb-5!'
        type='info'
        title='원본 자료 공개와 질문 발췌 공유는 별개입니다.'
        description='여기서 허용한 계정은 원본을 읽을 수 있습니다. 소유자의 개인 메모·대화·답안은 공개되지 않습니다.'
      />
      {query.error && (
        <Alert
          type='error'
          title={query.error.message}
        />
      )}
      {query.isPending && <Spin />}
      {query.data && (
        <Form
          key={`${material.id}:${query.data.version}`}
          form={form}
          layout='vertical'
          initialValues={{
            visibility: query.data.visibility,
            allowedUserIds: query.data.allowedUserIds,
            confirmed: false,
          }}
          disabled={!canPublish || mutation.isPending}>
          <Typography.Paragraph type='secondary'>
            원본 버전 v{query.data.version}
          </Typography.Paragraph>
          {!canPublish && (
            <Alert
              className='mb-4!'
              type='warning'
              title='타인의 비공개 자료를 운영 권한으로 공개 전환할 수 없습니다.'
              description='소유자가 공개 범위를 정하거나 운영자가 이용 권한을 확보한 원본을 직접 등록해야 합니다.'
            />
          )}
          <Form.Item
            name='visibility'
            label='열람 범위'
            rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'private', label: '자료 소유자만' },
                { value: 'public', label: '로그인한 모든 학생 · 공용 자료' },
                { value: 'accounts', label: '지정한 계정만' },
              ]}
            />
          </Form.Item>
          {visibility === 'accounts' && (
            <Form.Item
              name='allowedUserIds'
              label='열람 허용 계정'
              extra='허용할 계정 식별자를 입력해 주세요. 도우미의 담당 자료 배정과는 별개입니다.'
              rules={[
                {
                  required: true,
                  type: 'array',
                  min: 1,
                  message: '하나 이상의 계정을 지정해 주세요.',
                },
              ]}>
              <Select
                mode='tags'
                tokenSeparators={[',', ' ']}
                placeholder='계정 식별자 추가'
              />
            </Form.Item>
          )}
          <Form.Item
            name='confirmed'
            valuePropName='checked'
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(
                          '변경할 공개 범위와 이용 권한을 확인해 주세요.'
                        )
                      ),
              },
            ]}>
            <Checkbox>
              등록 원본의 이용 권한과 위 계정에 대한 공개 범위를 확인했습니다.
            </Checkbox>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

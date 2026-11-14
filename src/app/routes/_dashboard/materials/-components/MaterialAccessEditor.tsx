import { TextArea } from '@astryxdesign/core/TextArea';
import { useToast } from '@astryxdesign/core/Toast';
import { Text } from '@astryxdesign/core/Text';
import { Banner } from '@astryxdesign/core/Banner';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Selector } from '@astryxdesign/core/Selector';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Button } from '@astryxdesign/core/Button';
import { Dialog } from '@astryxdesign/core/Dialog';
import Form from 'rc-field-form';
import { FormField } from '@/components/ui/FormField';
import { useQuery } from '@tanstack/react-query';
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
  const toast = useToast();

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

      toast({
        type: 'info',
        body: '자료의 원본 접근 범위를 저장했습니다.',
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
      onOpenChange={() => {
        if (!mutation.isPending) onClose();
      }}
      width={680}>
      <DialogHeader
        title={'자료 원본 접근 범위'}
        onOpenChange={() => {
          if (!mutation.isPending) onClose();
        }}
      />
      <Text
        as='p'
        weight='semibold'>
        {material.title}
      </Text>
      <Banner
        className='mb-5!'
        status='info'
        title='원본 자료 공개와 질문 발췌 공유는 별개입니다.'
        description='여기서 허용한 계정은 원본을 읽을 수 있습니다. 소유자의 개인 메모·대화·답안은 공개되지 않습니다.'
      />
      {query.error && (
        <Banner
          status='error'
          title={query.error.message}
        />
      )}
      {query.isPending && <Spinner label='불러오는 중' />}
      {query.data && (
        <fieldset
          disabled={!canPublish || mutation.isPending}
          className='m-0 min-w-0 border-0 p-0'>
          <Form
            key={`${material.id}:${query.data.version}`}
            form={form}
            initialValues={{
              visibility: query.data.visibility,
              allowedUserIds: query.data.allowedUserIds,
              confirmed: false,
            }}>
            <Text
              as='p'
              color='secondary'>
              원본 버전 v{query.data.version}
            </Text>
            {!canPublish && (
              <Banner
                className='mb-4!'
                status='warning'
                title='타인의 비공개 자료를 운영 권한으로 공개 전환할 수 없습니다.'
                description='소유자가 공개 범위를 정하거나 운영자가 이용 권한을 확보한 원본을 직접 등록해야 합니다.'
              />
            )}
            <FormField
              name='visibility'
              label='열람 범위'
              rules={[{ required: true }]}>
              <Selector
                options={[
                  { value: 'private', label: '자료 소유자만' },
                  { value: 'public', label: '로그인한 모든 학생 · 공용 자료' },
                  { value: 'accounts', label: '지정한 계정만' },
                ]}
                label='입력'
                isLabelHidden
                value={''}
              />
            </FormField>
            {visibility === 'accounts' && (
              <FormField
                name='allowedUserIds'
                normalize={(text: string) =>
                  text.split(/[\s,]+/).filter(Boolean)
                }
                getValueProps={(values: string[] = []) => ({
                  value: values.join('\n'),
                })}
                label='열람 허용 계정'
                description='허용할 계정 식별자를 입력해 주세요. 도우미의 담당 자료 배정과는 별개입니다.'
                rules={[
                  {
                    required: true,
                    type: 'array',
                    min: 1,
                    message: '하나 이상의 계정을 지정해 주세요.',
                  },
                ]}>
                <TextArea
                  label='열람 허용 계정'
                  value=''
                  placeholder='계정 식별자를 한 줄에 하나씩 입력'
                />
              </FormField>
            )}
            <FormField
              name='confirmed'
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
              <CheckboxInput
                label='등록 원본의 이용 권한과 위 계정에 대한 공개 범위를 확인했습니다.'
                value={false}
              />
            </FormField>
          </Form>
        </fieldset>
      )}
      <Button
        label={'접근 범위 저장'}
        variant='primary'
        onClick={save}
        isLoading={mutation.isPending}
        isDisabled={!query.data || !canPublish}
      />
    </Dialog>
  );
}

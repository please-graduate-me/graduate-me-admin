import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Typography,
  Upload,
} from 'antd';
import { registerAdminMaterial } from '@/domains/operations/api/operations';
import {
  encodeMaterialPdf,
  extractMaterialPdf,
} from '@/domains/operations/lib/pdf';

type RegistrationValues = { title: string; language: 'en' | 'th'; url: string };

/** 원본 등록 뒤 공개 범위를 별도로 검토하도록 자료 준비를 연결한다. */
export function MaterialRegistration({ onClose }: { onClose: () => void }) {
  const [form] = Form.useForm<RegistrationValues>();
  const [kind, setKind] = useState<'pdf' | 'video'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const client = useQueryClient();
  const { message } = App.useApp();

  async function submit() {
    if (busy) return;

    try {
      const values = await form.validateFields();

      if (kind === 'pdf' && !file)
        throw new Error('등록할 PDF를 선택해 주세요.');
      setBusy(true);
      setError('');
      if (kind === 'pdf' && file) {
        const pages = await extractMaterialPdf(file, (page, total) =>
          setProgress(`${page} / ${total}페이지 확인 중`)
        );

        const contentBase64 = await encodeMaterialPdf(file);

        setProgress('원본 자료를 저장하고 있습니다.');

        await registerAdminMaterial({
          kind,
          title: values.title.trim(),
          language: values.language,
          filename: file.name,
          contentBase64,
          pages,
        });
      } else
        await registerAdminMaterial({
          kind: 'video',
          url: values.url.trim(),
          language: values.language,
        });
      await client.invalidateQueries({ queryKey: ['workspace', 'materials'] });

      message.success(
        '자료를 등록했습니다. 공개하기 전에 접근 범위를 확인해 주세요.'
      );

      onClose();
    } catch (error) {
      if (error instanceof Error) setError(error.message);
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  return (
    <Modal
      open
      title='학습 자료 등록'
      width={640}
      onCancel={() => {
        if (!busy) onClose();
      }}
      onOk={submit}
      okText='자료 등록'
      cancelText='취소'
      confirmLoading={busy}
      cancelButtonProps={{ disabled: busy }}
      closable={!busy}>
      <Alert
        type='info'
        title='이용 가능한 원본만 등록해 주세요.'
        description='자료 등록과 공용 공개는 별도 작업입니다. 학생의 개인 자료·메모를 공용으로 전환하지 않습니다.'
        className='mb-5!'
      />
      <Form
        form={form}
        layout='vertical'
        initialValues={{ language: 'en' }}
        disabled={busy}>
        <Form.Item label='자료 종류'>
          <Select
            value={kind}
            onChange={setKind}
            options={[
              { value: 'pdf', label: '수업 PDF' },
              { value: 'video', label: '공개 YouTube 영상' },
            ]}
          />
        </Form.Item>
        {kind === 'pdf' ? (
          <>
            <Form.Item
              label='원본 PDF'
              extra='10MB 이하, 최대 200페이지, 추출 텍스트 200만 자 이하'>
              <Upload
                accept='.pdf,application/pdf'
                maxCount={1}
                beforeUpload={(selected) => {
                  setFile(selected);
                  if (!form.getFieldValue('title'))
                    form.setFieldValue(
                      'title',
                      selected.name.replace(/\.pdf$/i, '')
                    );

                  return false;
                }}
                onRemove={() => setFile(null)}>
                <Button>PDF 선택</Button>
              </Upload>
            </Form.Item>
            <Form.Item
              name='title'
              label='자료 이름'
              rules={[{ required: true, whitespace: true }, { max: 200 }]}>
              <Input maxLength={200} />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            name='url'
            label='YouTube 주소'
            rules={[
              { required: true, whitespace: true },
              { type: 'url' },
              { max: 2048 },
            ]}>
            <Input placeholder='https://www.youtube.com/watch?v=...' />
          </Form.Item>
        )}
        <Form.Item
          name='language'
          label='학습 언어'
          rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'en', label: '영어' },
              { value: 'th', label: '태국어' },
            ]}
          />
        </Form.Item>
      </Form>
      {progress && (
        <Typography.Paragraph role='status'>{progress}</Typography.Paragraph>
      )}
      {error && (
        <Alert
          type='error'
          title={error}
        />
      )}
    </Modal>
  );
}

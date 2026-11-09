import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Typography,
  Upload,
} from 'antd';
import { learningPolicyQuery } from '@/domains/operations/api/policy';
import { registerAdminMaterial } from '@/domains/operations/api/operations';
import {
  encodeMaterialPdf,
  extractMaterialPdf,
} from '@/domains/operations/lib/pdf';

type RegistrationValues = {
  title: string;
  language: 'en' | 'th';
  url: string;
  learningPurposeConfirmed: boolean;
};

/** 원본 등록 뒤 공개 범위를 별도로 검토하도록 자료 준비를 연결한다. */
export function MaterialRegistration({ onClose }: { onClose: () => void }) {
  const [form] = Form.useForm<RegistrationValues>();
  const policy = useQuery(learningPolicyQuery);
  const confirmed = Form.useWatch('learningPurposeConfirmed', form);
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

      if (!policy.data) throw new Error('현재 등록 정책을 먼저 확인해 주세요.');
      if (!values.learningPurposeConfirmed)
        throw new Error('학습 목적과 이용 가능한 자료인지 확인해 주세요.');

      if (kind === 'pdf' && !file)
        throw new Error('등록할 PDF를 선택해 주세요.');
      setBusy(true);
      setError('');
      if (kind === 'pdf' && file) {
        const pages = await extractMaterialPdf(
          file,
          policy.data.pdf,
          (page, total) => setProgress(`${page} / ${total}페이지 확인 중`)
        );

        const contentBase64 = await encodeMaterialPdf(file);

        setProgress('원본 자료를 저장하고 있습니다.');

        await registerAdminMaterial({
          kind,
          learningPurposeConfirmed: true,
          title: values.title.trim(),
          language: values.language,
          filename: file.name,
          contentBase64,
          pages,
        });
      } else
        await registerAdminMaterial({
          kind: 'video',
          learningPurposeConfirmed: true,
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
      okButtonProps={{ disabled: !policy.data || !confirmed }}
      cancelButtonProps={{ disabled: busy }}
      closable={!busy}>
      <Alert
        type='info'
        title='이용 가능한 원본만 등록해 주세요.'
        description='자료 등록과 공용 공개는 별도 작업입니다. 학생의 개인 자료·메모를 공용으로 전환하지 않습니다.'
        className='mb-5!'
      />
      {policy.error && (
        <Alert
          type='error'
          title={policy.error.message}
          action={
            <Button onClick={() => void policy.refetch()}>
              등록 정책 다시 조회
            </Button>
          }
        />
      )}
      {policy.data && kind === 'video' && (
        <Alert
          className='mb-5!'
          type='info'
          title={`영상 최대 ${Math.ceil(policy.data.video.maxSeconds / 60)}분 · 새 영상 하루 ${policy.data.video.dailyNewLimit}개`}
          description={
            policy.data.video.transcriptionEnabled
              ? '명시적으로 등록한 새 영상만 준비하며 실패를 자동 재시도하지 않습니다.'
              : '현재 새 영상 전사는 사용할 수 없습니다. 이미 준비된 영상은 다시 등록해 학습할 수 있습니다.'
          }
        />
      )}
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
              { value: 'pdf', label: 'PDF' },
              { value: 'video', label: '공개 YouTube 영상' },
            ]}
          />
        </Form.Item>
        {kind === 'pdf' ? (
          <>
            <Form.Item
              label='원본 PDF'
              extra={
                policy.data
                  ? `${policy.data.pdf.maxBytes / 1024 / 1024}MB 이하, 최대 ${policy.data.pdf.maxPages}페이지, 새 PDF 하루 ${policy.data.pdf.dailyNewLimit}개, 추출 텍스트 200만 자 이하`
                  : '등록 한도 확인 중…'
              }>
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
        <Form.Item
          name='learningPurposeConfirmed'
          valuePropName='checked'
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        '학습 목적과 이용 가능한 자료인지 확인해 주세요.'
                      )
                    ),
            },
          ]}>
          <Checkbox>
            이 자료를 영어·태국어 학습에 사용하며 이용 권한이 있고 제한 자료가
            아님을 확인합니다.
          </Checkbox>
        </Form.Item>
        <Typography.Paragraph type='secondary'>
          등록 자료는 기본 비공개입니다. 적합성은 문자의 언어 단서와 확인한 학습
          목적을 기준으로 하며, 학습에 사용할 수 있는 오락 자료도 등록할 수
          있습니다.
        </Typography.Paragraph>
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

import { FileInput } from '@astryxdesign/core/FileInput';
import { useToast } from '@astryxdesign/core/Toast';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Text } from '@astryxdesign/core/Text';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Dialog } from '@astryxdesign/core/Dialog';
import Form from 'rc-field-form';
import { FormField } from '@/components/ui/FormField';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const toast = useToast();

  async function submit() {
    // 등록 횟수가 중복 차감되지 않게 처리 중 재전송을 차단한다.
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

      toast({
        type: 'info',
        body: '자료를 등록했습니다. 공개하기 전에 접근 범위를 확인해 주세요.',
      });

      onClose();
    } catch (error) {
      if (error instanceof Error) setError(error.message);
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  return (
    <Dialog
      isOpen
      width={640}
      onOpenChange={() => {
        if (!busy) onClose();
      }}>
      <DialogHeader
        title={'학습 자료 등록'}
        onOpenChange={() => {
          if (!busy) onClose();
        }}
      />
      <Banner
        status='info'
        title='이용 가능한 원본만 등록해 주세요.'
        description='자료 등록과 공용 공개는 별도 작업입니다. 학생의 개인 자료·메모를 공용으로 전환하지 않습니다.'
        className='mb-5!'
      />
      {policy.error && (
        <Banner
          status='error'
          title={policy.error.message}
          endContent={
            <Button
              onClick={() => void policy.refetch()}
              variant='secondary'
              label='등록 정책 다시 조회'
            />
          }
        />
      )}
      {policy.data && kind === 'video' && (
        <Banner
          className='mb-5!'
          status='info'
          title={`영상 최대 ${Math.ceil(policy.data.video.maxSeconds / 60)}분 · 새 영상 하루 ${policy.data.video.dailyNewLimit}개`}
          description={
            policy.data.video.transcriptionEnabled
              ? '명시적으로 등록한 새 영상만 준비하며 실패를 자동 재시도하지 않습니다.'
              : '현재 새 영상 전사는 사용할 수 없습니다. 이미 준비된 영상은 다시 등록해 학습할 수 있습니다.'
          }
        />
      )}
      <fieldset
        disabled={busy}
        className='m-0 min-w-0 border-0 p-0'>
        <Form
          className='flex flex-col gap-4'
          form={form}
          initialValues={{ language: 'en' }}>
          <FormField label='자료 종류'>
            <Selector
              value={kind}
              onChange={(value) => {
                if (value === 'pdf' || value === 'video') setKind(value);
              }}
              options={[
                { value: 'pdf', label: 'PDF' },
                { value: 'video', label: '공개 YouTube 영상' },
              ]}
              label='입력'
              isLabelHidden
            />
          </FormField>
          {kind === 'pdf' ? (
            <>
              <FormField
                label='원본 PDF'
                description={
                  policy.data
                    ? `${policy.data.pdf.maxBytes / 1024 / 1024}MB 이하, 최대 ${policy.data.pdf.maxPages}페이지, 새 PDF 하루 ${policy.data.pdf.dailyNewLimit}개, 추출 텍스트 200만 자 이하`
                    : '등록 한도 확인 중…'
                }>
                <FileInput
                  label='원본 PDF'
                  value={file}
                  accept='.pdf,application/pdf'
                  isDisabled={busy}
                  onChange={(files) => {
                    const selected = Array.isArray(files)
                      ? (files[0] ?? null)
                      : files;

                    setFile(selected);
                    if (selected && !form.getFieldValue('title'))
                      form.setFieldValue(
                        'title',
                        selected.name.replace(/\.pdf$/i, '')
                      );
                  }}
                />
              </FormField>
              <FormField
                name='title'
                label='자료 이름'
                rules={[{ required: true, whitespace: true }, { max: 200 }]}>
                <TextInput
                  label='입력'
                  isLabelHidden
                  value={''}
                />
              </FormField>
            </>
          ) : (
            <FormField
              name='url'
              label='YouTube 주소'
              rules={[
                { required: true, whitespace: true },
                { type: 'url' },
                { max: 2048 },
              ]}>
              <TextInput
                placeholder='https://www.youtube.com/watch?v=...'
                label={'https://www.youtube.com/watch?v=...'}
                isLabelHidden
                value={''}
              />
            </FormField>
          )}
          <FormField
            name='language'
            label='학습 언어'
            rules={[{ required: true }]}>
            <Selector
              options={[
                { value: 'en', label: '영어' },
                { value: 'th', label: '태국어' },
              ]}
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
          <FormField
            name='learningPurposeConfirmed'
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
            <CheckboxInput
              label='이 자료를 영어·태국어 학습에 사용하며 이용 권한이 있고 제한 자료가 아님을 확인합니다.'
              value={false}
            />
          </FormField>
          <Text
            as='p'
            color='secondary'>
            등록 자료는 기본 비공개입니다. 적합성은 문자의 언어 단서와 확인한
            학습 목적을 기준으로 하며, 학습에 사용할 수 있는 오락 자료도 등록할
            수 있습니다.
          </Text>
        </Form>
      </fieldset>
      {progress && (
        <Text
          role='status'
          as='p'>
          {progress}
        </Text>
      )}
      {error && (
        <Banner
          status='error'
          title={error}
        />
      )}
      <Button
        label={'자료 등록'}
        variant='primary'
        onClick={submit}
        isLoading={busy}
        isDisabled={!policy.data || !confirmed}
      />
    </Dialog>
  );
}

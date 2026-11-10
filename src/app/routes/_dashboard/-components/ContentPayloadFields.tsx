import { Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import type { FormInstance } from 'antd';
import type { Content } from '@/domains/content/model/contracts';
import { candidateUnits, type ContentEditorValues } from './contentForm';

/** 학과 도우미가 설명·문제·전사 내용을 업무 언어로 편집하게 한다. */
export function ContentPayloadFields({
  content,
  form,
}: {
  content: Content;
  form: FormInstance<ContentEditorValues>;
}) {
  const type = Form.useWatch('type', form);
  const text = Form.useWatch('text', form) as string | undefined;

  const units =
    content.kind === 'segment'
      ? candidateUnits(text ?? content.payload.text, content.source.language)
      : [];

  if (content.kind === 'explanation')
    return (
      <>
        <Form.Item
          name='translation'
          label='원문 번역'
          rules={[{ required: true, whitespace: true }, { max: 10000 }]}>
          <Input.TextArea
            rows={3}
            maxLength={10000}
          />
        </Form.Item>
        <Form.Item
          name='meaning'
          label='현재 문맥의 뜻'
          rules={[{ max: 10000 }]}>
          <Input.TextArea
            rows={3}
            maxLength={10000}
          />
        </Form.Item>
        <Form.Item
          name='structure'
          label='문장 구조 · 문법'
          rules={[{ max: 10000 }]}>
          <Input.TextArea
            rows={3}
            maxLength={10000}
          />
        </Form.Item>
        <Form.Item
          name='concept'
          label='개념과 적용'
          rules={[{ max: 10000 }]}>
          <Input.TextArea
            rows={3}
            maxLength={10000}
          />
        </Form.Item>
        <Form.Item
          name='examplesText'
          label='추가 예문'
          extra='원문이 아닌 추가 예문입니다. 한 줄에 하나씩 작성해 주세요.'
          rules={[
            { max: 16007 },
            {
              validator: (_, value: string) => {
                const examples = (value ?? '')
                  .split(/\r?\n/)
                  .map((item) => item.trim())
                  .filter(Boolean);

                return examples.length <= 8 &&
                  examples.every((item) => item.length <= 2000)
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        '예문은 각각 2,000자 이내로 최대 8개까지 작성합니다.'
                      )
                    );
              },
            },
          ]}>
          <Input.TextArea
            rows={3}
            maxLength={16007}
          />
        </Form.Item>
        <Form.Item
          name='uncertainty'
          label='불확실한 부분과 해석 범위'
          rules={[{ max: 4000 }]}>
          <Input.TextArea
            rows={2}
            maxLength={4000}
          />
        </Form.Item>
        <Typography.Paragraph type='secondary'>
          인용 근거는 학생이 공유한 원문을 유지합니다.
        </Typography.Paragraph>
      </>
    );
  if (content.kind === 'practice')
    return (
      <>
        <Form.Item
          name='type'
          label='문제 형식'
          rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'choice', label: '객관식' },
              { value: 'short_answer', label: '정답형 단답' },
              { value: 'free_response', label: '자유 답변' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name='question'
          label='문제'
          rules={[{ required: true, whitespace: true }, { max: 5000 }]}>
          <Input.TextArea
            rows={4}
            maxLength={5000}
          />
        </Form.Item>
        {type === 'choice' && (
          <Form.Item
            name='choicesText'
            label='선택지'
            extra='한 줄에 하나씩 작성합니다. 정답에는 해당 선택지의 전체 문구를 입력합니다.'
            rules={[
              { required: true, whitespace: true },
              {
                validator: (_, value: string) => {
                  const choices = (value ?? '')
                    .split(/\r?\n/)
                    .map((v) => v.trim())
                    .filter(Boolean);

                  return choices.length >= 2 &&
                    choices.length <= 5 &&
                    choices.every((choice) => choice.length <= 2000) &&
                    new Set(choices).size === choices.length
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error('서로 다른 선택지를 2~5개 작성해 주세요.')
                      );
                },
              },
            ]}>
            <Input.TextArea rows={5} />
          </Form.Item>
        )}
        <Form.Item
          name='answer'
          label={type === 'free_response' ? '참고 답변' : '정답'}
          rules={[
            { required: true, whitespace: true },
            { max: 5000 },
            ({ getFieldValue }) => ({
              validator: (_, value: string) =>
                getFieldValue('type') !== 'choice' ||
                ((getFieldValue('choicesText') as string) ?? '')
                  .split(/\r?\n/)
                  .some((choice) => choice.trim() === value?.trim())
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error('정답은 선택지의 전체 문구와 일치해야 합니다.')
                    ),
            }),
          ]}>
          <Input.TextArea
            rows={2}
            maxLength={5000}
          />
        </Form.Item>
        <Form.Item
          name='explanation'
          label='해설'
          rules={[{ required: true, whitespace: true }, { max: 10000 }]}>
          <Input.TextArea
            rows={3}
            maxLength={10000}
          />
        </Form.Item>
        <Form.Item
          name='hint'
          label='힌트'
          rules={[{ required: true, whitespace: true }, { max: 2000 }]}>
          <Input.TextArea
            rows={2}
            maxLength={2000}
          />
        </Form.Item>
        <Form.Item
          name='sourceQuote'
          label='정답의 원문 근거'
          rules={[{ required: true, whitespace: true }, { max: 5000 }]}>
          <Input.TextArea
            rows={3}
            maxLength={5000}
          />
        </Form.Item>
      </>
    );

  return (
    <>
      <Form.Item
        name='text'
        label='원문 전사'
        rules={[{ required: true, whitespace: true }, { max: 5000 }]}>
        <Input.TextArea
          rows={4}
          maxLength={5000}
        />
      </Form.Item>
      <Space align='start'>
        <Form.Item
          name='start'
          label='시작 시간 · 초'
          rules={[{ required: true }, { type: 'number', min: 0 }]}>
          <InputNumber
            min={0}
            precision={2}
          />
        </Form.Item>
        <Form.Item
          name='end'
          label='종료 시간 · 초'
          dependencies={['start']}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator: (_, value: number) =>
                value > getFieldValue('start')
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error('종료는 시작 시간보다 뒤여야 합니다.')
                    ),
            }),
          ]}>
          <InputNumber
            min={0}
            precision={2}
          />
        </Form.Item>
      </Space>
      <Form.Item
        name='translation'
        label='저장 번역'
        rules={[{ max: 10000 }]}>
        <Input.TextArea
          rows={3}
          maxLength={10000}
        />
      </Form.Item>
      <Form.Item
        name='blankCandidates'
        label='빈칸으로 사용할 단어'
        extra='바뀐 전사문의 단어를 확인하고 선택해 주세요.'
        rules={[
          {
            validator: (_, values: number[] | undefined) =>
              (values ?? []).every(
                (index) =>
                  Number.isInteger(index) &&
                  index >= 0 &&
                  index < units.length &&
                  /[\p{L}\p{N}]/u.test(units[index])
              )
                ? Promise.resolve()
                : Promise.reject(
                    new Error('전사 변경 후 빈칸 단어를 다시 선택해 주세요.')
                  ),
          },
        ]}>
        <Select
          mode='multiple'
          options={units
            .map((unit, index) => ({
              value: index,
              label: `${index + 1}. ${unit}`,
            }))
            .filter((item) => /[\p{L}\p{N}]/u.test(units[item.value]))}
        />
      </Form.Item>
    </>
  );
}

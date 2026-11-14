import { TextArea } from '@astryxdesign/core/TextArea';
import { Text } from '@astryxdesign/core/Text';
import { Selector } from '@astryxdesign/core/Selector';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Stack } from '@astryxdesign/core/Stack';
import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import Form from 'rc-field-form';
import type { FormInstance } from 'rc-field-form';
import { FormField } from '@/components/ui/FormField';
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
        <FormField
          name='translation'
          label='원문 번역'
          rules={[{ required: true, whitespace: true }, { max: 10000 }]}>
          <TextArea
            rows={3}
            maxLength={10000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField
          name='meaning'
          label='현재 문맥의 뜻'
          rules={[{ max: 10000 }]}>
          <TextArea
            rows={3}
            maxLength={10000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField
          name='structure'
          label='문장 구조 · 문법'
          rules={[{ max: 10000 }]}>
          <TextArea
            rows={3}
            maxLength={10000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField
          name='concept'
          label='개념과 적용'
          rules={[{ max: 10000 }]}>
          <TextArea
            rows={3}
            maxLength={10000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField
          name='examplesText'
          label='추가 예문'
          description='원문이 아닌 추가 예문입니다. 한 줄에 하나씩 작성해 주세요.'
          rules={[
            { max: 16007 },
            {
              validator: (_, value: string) => {
                // 빈 줄이 서버의 예문 수 제한을 잘못 차감하지 않게 같은 기준으로 검증한다.
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
          <TextArea
            rows={3}
            maxLength={16007}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField
          name='uncertainty'
          label='불확실한 부분과 해석 범위'
          rules={[{ max: 4000 }]}>
          <TextArea
            rows={2}
            maxLength={4000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <Text
          as='p'
          color='secondary'>
          인용 근거는 학생이 공유한 원문을 유지합니다.
        </Text>
      </>
    );
  if (content.kind === 'practice')
    return (
      <>
        <FormField
          name='type'
          label='문제 형식'
          rules={[{ required: true }]}>
          <Selector
            options={[
              { value: 'choice', label: '객관식' },
              { value: 'short_answer', label: '정답형 단답' },
              { value: 'free_response', label: '자유 답변' },
            ]}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField
          name='question'
          label='문제'
          rules={[{ required: true, whitespace: true }, { max: 5000 }]}>
          <TextArea
            rows={4}
            maxLength={5000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        {type === 'choice' && (
          <FormField
            name='choicesText'
            label='선택지'
            description='한 줄에 하나씩 작성합니다. 정답에는 해당 선택지의 전체 문구를 입력합니다.'
            rules={[
              { required: true, whitespace: true },
              {
                validator: (_, value: string) => {
                  // 중복 선택지가 두 정답처럼 보이는 모호한 문항을 새 버전에 저장하지 않는다.
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
            <TextArea
              rows={5}
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
        )}
        <FormField
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
          <TextArea
            rows={2}
            maxLength={5000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField
          name='explanation'
          label='해설'
          rules={[{ required: true, whitespace: true }, { max: 10000 }]}>
          <TextArea
            rows={3}
            maxLength={10000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField
          name='hint'
          label='힌트'
          rules={[{ required: true, whitespace: true }, { max: 2000 }]}>
          <TextArea
            rows={2}
            maxLength={2000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
        <FormField
          name='sourceQuote'
          label='정답의 원문 근거'
          rules={[{ required: true, whitespace: true }, { max: 5000 }]}>
          <TextArea
            rows={3}
            maxLength={5000}
            label='입력'
            isLabelHidden
            value={''}
          />
        </FormField>
      </>
    );

  return (
    <>
      <FormField
        name='text'
        label='원문 전사'
        rules={[{ required: true, whitespace: true }, { max: 5000 }]}>
        <TextArea
          rows={4}
          maxLength={5000}
          label='입력'
          isLabelHidden
          value={''}
        />
      </FormField>
      <Stack
        direction='horizontal'
        gap={2}>
        <FormField
          name='start'
          label='시작 시간 · 초'
          rules={[{ required: true }, { type: 'number', min: 0 }]}>
          <NumberInput
            min={0}
            label='입력'
            isLabelHidden
            value={null}
            onChange={() => {}}
          />
        </FormField>
        <FormField
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
          <NumberInput
            min={0}
            label='입력'
            isLabelHidden
            value={null}
            onChange={() => {}}
          />
        </FormField>
      </Stack>
      <FormField
        name='translation'
        label='저장 번역'
        rules={[{ max: 10000 }]}>
        <TextArea
          rows={3}
          maxLength={10000}
          label='입력'
          isLabelHidden
          value={''}
        />
      </FormField>
      <FormField
        name='blankCandidates'
        normalize={(values: string[]) => values.map(Number)}
        getValueProps={(values: number[] = []) => ({
          value: values.map(String),
        })}
        label='빈칸으로 사용할 단어'
        description='바뀐 전사문의 단어를 확인하고 선택해 주세요.'
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
        <MultiSelector
          onChange={() => {}}
          options={units
            .map((unit, index) => ({
              value: String(index),
              label: `${index + 1}. ${unit}`,
            }))
            .filter((item) => /[\p{L}\p{N}]/u.test(units[Number(item.value)]))}
          label='입력'
          isLabelHidden
          value={[]}
        />
      </FormField>
    </>
  );
}

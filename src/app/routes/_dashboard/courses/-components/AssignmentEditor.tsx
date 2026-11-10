import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
} from 'antd';
import {
  assignmentMaterialsQuery,
  useSaveAssignment,
} from '@/domains/courses/api/courses';
import type { Assignment } from '@/domains/courses/model/contracts';

type Values = {
  title: string;
  kind: 'pdf' | 'video';
  sourceId: string;
  from: number;
  to: number;
  mode: 'full' | 'blank' | 'reading';
  blankRatio: 20 | 40 | 60;
  dueAt: string;
  allowLate: boolean;
  allowResubmit: boolean;
  allowHints: boolean;
  revealAfterSubmit: boolean;
  reason?: string;
};

/** 준비된 원본의 범위와 제출 정책을 버전이 있는 과제로 저장한다. */
export function AssignmentEditor({
  courseId,
  language,
  assignment,
  onClose,
}: {
  courseId: string;
  language: 'en' | 'th';
  assignment?: Assignment;
  onClose: () => void;
}) {
  const [form] = Form.useForm<Values>();

  const kind =
    Form.useWatch('kind', form) ?? assignment?.source.kind ?? 'video';

  const mode = Form.useWatch('mode', form);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const materials = useQuery(assignmentMaterialsQuery(kind, language, q, page));
  const save = useSaveAssignment(courseId);
  const { message } = App.useApp();

  const [initialDate] = useState(() =>
    assignment
      ? new Date(assignment.dueAt)
      : new Date(Date.now() + 7 * 86_400_000)
  );

  const localDate = new Date(
    initialDate.getTime() - initialDate.getTimezoneOffset() * 60_000
  )
    .toISOString()
    .slice(0, 16);

  const initialFrom =
    assignment?.source.fromIndex ??
    (assignment?.source.tasks[0]?.page
      ? assignment.source.tasks[0].page - 1
      : 0);

  const sourceOptions = [...(materials.data?.items ?? [])];

  if (
    assignment &&
    !sourceOptions.some((item) => item.id === assignment.source.id)
  )
    sourceOptions.unshift({
      id: assignment.source.id,
      title: assignment.source.title,
      language,
    });

  return (
    <Modal
      open
      width={760}
      title={assignment ? `과제 수정 · v${assignment.version}` : '과제 배정'}
      okText={assignment ? '새 버전 저장' : '과제 배정'}
      cancelText='취소'
      confirmLoading={save.isPending}
      onCancel={onClose}
      onOk={async () => {
        try {
          const values = await form.validateFields();

          await save.mutateAsync({
            id: assignment?.id,
            expectedVersion: assignment?.version,
            reason: values.reason,
            body: {
              title: values.title,
              ...(values.kind === 'pdf'
                ? { materialId: values.sourceId }
                : { videoId: values.sourceId }),
              // 표시 번호와 저장 인덱스의 차이로 과제가 한 구절 밀려 배정되지 않게 한다.
              fromIndex: values.from - 1,
              toIndex: values.to - 1,
              mode: values.kind === 'pdf' ? 'reading' : values.mode,
              blankRatio: values.blankRatio,
              dueAt: new Date(values.dueAt).toISOString(),
              allowLate: values.allowLate,
              allowResubmit: values.allowResubmit,
              allowHints: values.allowHints,
              revealAfterSubmit: values.revealAfterSubmit,
            },
          });

          message.success(
            assignment
              ? '기존 제출을 보존하고 새 과제 버전을 저장했습니다.'
              : '과제를 배정했습니다.'
          );

          onClose();
        } catch (error) {
          if (error instanceof Error) message.error(error.message);
        }
      }}>
      <Alert
        type='info'
        className='mb-5!'
        title='조회·배정·수정에는 AI를 호출하지 않습니다.'
        description='준비된 원본과 정답을 고정해 배정합니다. 원본의 공개 범위는 자동으로 바꾸지 않으므로 수강생의 자료 접근 권한을 별도로 확인해 주세요.'
      />
      <Form
        form={form}
        layout='vertical'
        initialValues={{
          title: assignment?.title ?? '',
          kind: assignment?.source.kind ?? 'video',
          sourceId: assignment?.source.id,
          from: initialFrom + 1,
          to:
            assignment?.source.toIndex === undefined
              ? initialFrom + (assignment?.source.tasks.length ?? 1)
              : assignment.source.toIndex + 1,
          mode: assignment?.mode ?? 'full',
          blankRatio: assignment?.source.blankRatio ?? 20,
          dueAt: localDate,
          allowLate: assignment?.allowLate ?? false,
          allowResubmit: assignment?.allowResubmit ?? true,
          allowHints: assignment?.allowHints ?? false,
          revealAfterSubmit: assignment?.revealAfterSubmit ?? true,
        }}>
        <Form.Item
          name='title'
          label='과제명'
          rules={[{ required: true, whitespace: true, max: 200 }]}>
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item
          name='kind'
          label='자료 종류'>
          <Radio.Group
            options={[
              { value: 'video', label: '영상 받아쓰기' },
              { value: 'pdf', label: 'PDF 읽기 응답' },
            ]}
            onChange={() => {
              form.setFieldValue('sourceId', undefined);
              setQ('');
              setPage(1);
            }}
          />
        </Form.Item>
        <Form.Item
          name='sourceId'
          label='학습 자료'
          rules={[
            { required: true, message: '접근 가능한 자료를 선택해 주세요.' },
          ]}>
          <Select
            showSearch={{
              filterOption: false,
              onSearch: (value) => {
                setQ(value);
                setPage(1);
              },
            }}
            loading={materials.isPending}
            options={sourceOptions.map((item) => ({
              value: item.id,
              label: item.title,
            }))}
            placeholder='자료명 검색'
            notFoundContent={
              materials.error
                ? materials.error.message
                : '접근 가능한 준비 자료가 없습니다.'
            }
          />
        </Form.Item>
        {(page > 1 || materials.data?.hasMore) && (
          <Space className='mb-4'>
            <Button
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}>
              이전 자료
            </Button>
            <Button
              disabled={!materials.data?.hasMore}
              onClick={() => setPage((value) => value + 1)}>
              다음 자료
            </Button>
          </Space>
        )}
        <Space
          size={20}
          align='start'>
          <Form.Item
            name='from'
            label={kind === 'pdf' ? '시작 페이지' : '시작 구절 번호'}
            rules={[{ required: true }]}>
            <InputNumber
              min={1}
              precision={0}
            />
          </Form.Item>
          <Form.Item
            name='to'
            label={kind === 'pdf' ? '마지막 페이지' : '마지막 구절 번호'}
            dependencies={['from']}
            rules={[
              { required: true },
              {
                validator: (_, value) =>
                  value >= form.getFieldValue('from') &&
                  value - form.getFieldValue('from') < 30
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error('시작부터 최대 30개 범위로 지정해 주세요.')
                      ),
              },
            ]}>
            <InputNumber
              min={1}
              precision={0}
            />
          </Form.Item>
        </Space>
        {kind === 'video' && (
          <Space
            size={20}
            align='start'>
            <Form.Item
              name='mode'
              label='받아쓰기 모드'>
              <Select
                className='w-48!'
                options={[
                  { value: 'full', label: '전체 문장' },
                  { value: 'blank', label: '빈칸' },
                ]}
              />
            </Form.Item>
            {mode === 'blank' && (
              <Form.Item
                name='blankRatio'
                label='빈칸 비율'>
                <Select
                  className='w-28!'
                  options={[20, 40, 60].map((value) => ({
                    value,
                    label: `${value}%`,
                  }))}
                />
              </Form.Item>
            )}
          </Space>
        )}
        <Form.Item
          name='dueAt'
          label='제출 기한 · 현재 기기 시간대'
          rules={[{ required: true }]}>
          <Input type='datetime-local' />
        </Form.Item>
        <div className='grid grid-cols-2 gap-x-5'>
          <Form.Item
            name='allowLate'
            label='기한 후 제출 허용'
            valuePropName='checked'>
            <Switch />
          </Form.Item>
          <Form.Item
            name='allowResubmit'
            label='같은 버전 재제출 허용'
            valuePropName='checked'>
            <Switch />
          </Form.Item>
          <Form.Item
            name='allowHints'
            label='힌트 허용'
            valuePropName='checked'>
            <Switch />
          </Form.Item>
          <Form.Item
            name='revealAfterSubmit'
            label='제출 후 정답 공개'
            valuePropName='checked'>
            <Switch />
          </Form.Item>
        </div>
        {assignment && (
          <Form.Item
            name='reason'
            label='변경 사유'
            rules={[{ required: true, whitespace: true, max: 2000 }]}>
            <Input.TextArea
              rows={3}
              maxLength={2000}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

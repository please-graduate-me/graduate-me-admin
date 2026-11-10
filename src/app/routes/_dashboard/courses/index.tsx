import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Alert,
  App,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
} from 'antd';
import { coursesQuery, useCreateCourse } from '@/domains/courses/api/courses';
import { formatDate } from '@/domains/questions/lib/format';
import { PageHeading } from '../-components/PageHeading';
import { QueryError } from '../-components/QueryError';

/** 수업 운영은 전역 관리자 권한 없이 소속 수업 안에서만 제공한다. */
export const Route = createFileRoute('/_dashboard/courses/')({
  component: Courses,
});

function Courses() {
  const query = useQuery(coursesQuery);
  const create = useCreateCourse();
  const navigate = Route.useNavigate();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ title: string; language: 'en' | 'th' }>();

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='수업 · 과제 관리'
        description='소속 수업의 자료와 과제를 배정하고 제출 현황을 확인합니다.'
        action={
          <Button
            type='primary'
            onClick={() => setOpen(true)}>
            수업 만들기
          </Button>
        }
      />
      <Alert
        type='info'
        title='수업 개설은 학교의 공식 교수 인증·학사 연동과 별개입니다.'
        description='개설한 수업의 담당자 권한은 해당 수업에만 적용됩니다. 다른 수업과 학생 개인 메모·대화·학습 이력은 조회하지 않습니다.'
      />
      {query.error && (
        <QueryError
          error={query.error}
          retry={() => query.refetch()}
        />
      )}
      <Table
        rowKey='id'
        dataSource={query.data?.items ?? []}
        loading={query.isPending}
        locale={{
          emptyText: (
            <Empty description='소속 수업이 없습니다. 수업을 만들거나 학생 서비스에서 초대 코드로 참여해 주세요.' />
          ),
        }}
        columns={[
          {
            title: '수업',
            dataIndex: 'title',
            render: (_, item) => (
              <Link
                to='/courses/$courseId'
                params={{ courseId: item.id }}>
                {item.title}
                {item.ownerUnavailable && (
                  <Tag
                    color='warning'
                    className='ml-2!'>
                    개설자 탈퇴 · 신규 초대 중지
                  </Tag>
                )}
              </Link>
            ),
          },
          {
            title: '언어',
            dataIndex: 'language',
            render: (value) => (value === 'en' ? '영어' : '태국어'),
          },
          {
            title: '수업 역할',
            dataIndex: 'role',
            render: (value) => (
              <Tag color={value === 'student' ? undefined : 'blue'}>
                {value === 'teacher'
                  ? '교사 · 개설자'
                  : value === 'assistant'
                    ? '조교'
                    : '수강생'}
              </Tag>
            ),
          },
          { title: '개설일', dataIndex: 'createdAt', render: formatDate },
        ]}
      />
      <Modal
        open={open}
        title='수업 만들기'
        okText='수업 생성'
        cancelText='취소'
        confirmLoading={create.isPending}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const result = await create.mutateAsync(values);

            setOpen(false);

            await navigate({
              to: '/courses/$courseId',
              params: { courseId: result.id },
            });
          } catch (error) {
            if (error instanceof Error) message.error(error.message);
          }
        }}>
        <Form
          form={form}
          layout='vertical'
          initialValues={{ language: 'en' }}>
          <Form.Item
            name='title'
            label='수업명'
            rules={[{ required: true, whitespace: true, max: 200 }]}>
            <Input maxLength={200} />
          </Form.Item>
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
      </Modal>
    </section>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Alert,
  App,
  Button,
  Card,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { courseQuery, useCourseMember } from '@/domains/courses/api/courses';
import { formatDate } from '@/domains/questions/lib/format';
import { AssignmentEditor } from '../-components/AssignmentEditor';
import { PageHeading } from '../../-components/PageHeading';
import { QueryError } from '../../-components/QueryError';

/** 담당 수업의 초대·역할·과제만 운영하고 학생 개인 이력은 분리한다. */
export const Route = createFileRoute('/_dashboard/courses/$courseId/')({
  component: Course,
});

function Course() {
  const { courseId } = Route.useParams();
  const { access } = Route.useRouteContext();
  const query = useQuery(courseQuery(courseId));
  const member = useCourseMember(courseId);
  const { message } = App.useApp();
  const [assigning, setAssigning] = useState(false);

  if (query.error)
    return (
      <QueryError
        error={query.error}
        retry={() => query.refetch()}
      />
    );
  if (!query.data)
    return (
      <Spin>
        <div className='h-64' />
      </Spin>
    );
  const { course, members, assignments } = query.data;
  const staff = course.role !== 'student';

  async function changeMember(input: Parameters<typeof member.mutateAsync>[0]) {
    try {
      await member.mutateAsync(input);
      message.success('수업 구성원을 변경했습니다.');
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  }

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title={course.title}
        description={`${course.language === 'en' ? '영어' : '태국어'} 수업 · ${course.role === 'teacher' ? '개설자' : course.role === 'assistant' ? '조교' : '수강생'}`}
        action={<Link to='/courses'>수업 목록</Link>}
      />
      {course.ownerUnavailable && (
        <Alert
          type='warning'
          title='개설자가 탈퇴한 수업입니다.'
          description='새 초대 코드 가입은 중지되었습니다. 기존 구성원과 배정 과제·제출 이력은 보존됩니다.'
        />
      )}
      {course.inviteCode && !course.ownerUnavailable && (
        <Card title='수강생 초대'>
          <Typography.Paragraph>
            학생 서비스의 수업 참여 화면에서 아래 코드를 입력합니다. 코드를 아는
            로그인 계정이 수강생으로 참여할 수 있습니다.
          </Typography.Paragraph>
          <Typography.Text
            code
            copyable>
            {course.inviteCode}
          </Typography.Text>
        </Card>
      )}
      <Card
        title='배정 과제'
        extra={
          staff ? (
            <Button
              type='primary'
              onClick={() => setAssigning(true)}>
              과제 배정
            </Button>
          ) : undefined
        }>
        <Table
          rowKey='id'
          dataSource={assignments}
          locale={{ emptyText: '배정된 과제가 없습니다.' }}
          columns={[
            {
              title: '과제',
              render: (_, item) => (
                <Link
                  to='/courses/$courseId/assignments/$assignmentId'
                  params={{ courseId, assignmentId: item.id }}>
                  {item.title} · v{item.version}
                </Link>
              ),
            },
            {
              title: '자료',
              render: (_, item) =>
                `${item.source.title} · ${item.taskCount}${item.source.kind === 'pdf' ? '페이지' : '구절'}`,
            },
            {
              title: '모드',
              dataIndex: 'mode',
              render: (value) =>
                value === 'full'
                  ? '전체 받아쓰기'
                  : value === 'blank'
                    ? '빈칸 받아쓰기'
                    : '읽기 응답',
            },
            { title: '제출 기한', dataIndex: 'dueAt', render: formatDate },
            {
              title: '제출 정책',
              render: (_, item) => (
                <Space>
                  <Tag>{item.allowLate ? '지각 허용' : '기한 엄수'}</Tag>
                  <Tag>{item.allowResubmit ? '재제출 허용' : '1회 제출'}</Tag>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Card title={staff ? `수업 구성원 ${members.length}명` : '내 수업 소속'}>
        <Table
          rowKey='userId'
          dataSource={members}
          columns={[
            {
              title: '이름',
              render: (_, item) => (
                <Space
                  orientation='vertical'
                  size={0}>
                  <Typography.Text>{item.name || '이름 없음'}</Typography.Text>
                  <Typography.Text
                    type='secondary'
                    copyable>
                    {item.userId}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: '역할',
              render: (_, item) =>
                course.role === 'teacher' && item.role !== 'teacher' ? (
                  <Select
                    aria-label={`${item.name || '구성원'} 역할`}
                    value={item.role}
                    loading={member.isPending}
                    options={[
                      { value: 'student', label: '수강생' },
                      { value: 'assistant', label: '조교' },
                    ]}
                    onChange={(role) =>
                      void changeMember({ userId: item.userId, role })
                    }
                  />
                ) : item.role === 'teacher' ? (
                  '교사 · 개설자'
                ) : item.role === 'assistant' ? (
                  '조교'
                ) : (
                  '수강생'
                ),
            },
            {
              title: '구성원 관리',
              render: (_, item) =>
                item.role !== 'teacher' &&
                (course.role === 'teacher' ||
                  item.userId === access.user.id) ? (
                  <Popconfirm
                    title={
                      item.userId === access.user.id
                        ? '수업에서 나가시겠습니까?'
                        : '이 구성원을 수업에서 제외하시겠습니까?'
                    }
                    onConfirm={() => changeMember({ remove: item.userId })}>
                    <Button
                      danger
                      loading={member.isPending}>
                      {item.userId === access.user.id ? '탈퇴' : '제외'}
                    </Button>
                  </Popconfirm>
                ) : null,
            },
          ]}
        />
      </Card>
      <Alert
        type='info'
        title='수업 가입과 원본 자료 접근 권한은 별도입니다.'
        description='배정 전 자료의 준비·재생 상태와 수강생의 원본 접근 권한을 확인해 주세요. 과제 제출은 개인 학습·메모·질문 기록을 변경하지 않습니다.'
      />
      {assigning && (
        <AssignmentEditor
          courseId={courseId}
          language={course.language}
          onClose={() => setAssigning(false)}
        />
      )}
    </section>
  );
}

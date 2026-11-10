import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { assignmentQuery, courseQuery } from '@/domains/courses/api/courses';
import { formatDate } from '@/domains/questions/lib/format';
import { AssignmentEditor } from '../../-components/AssignmentEditor';
import { PageHeading } from '../../../-components/PageHeading';
import { QueryError } from '../../../-components/QueryError';

/** 과제 수정·제출 현황을 당시 버전의 답안·정답과 함께 확인한다. */
export const Route = createFileRoute(
  '/_dashboard/courses/$courseId/assignments/$assignmentId'
)({ component: AssignmentDetail });

function AssignmentDetail() {
  const { courseId, assignmentId } = Route.useParams();
  const course = useQuery(courseQuery(courseId));
  const query = useQuery(assignmentQuery(courseId, assignmentId));
  const [editing, setEditing] = useState(false);
  const [now] = useState(() => Date.now());

  if (query.error || course.error)
    return (
      <QueryError
        error={(query.error || course.error)!}
        retry={() => {
          void query.refetch();
          void course.refetch();
        }}
      />
    );
  if (!query.data || !course.data)
    return (
      <Spin>
        <div className='h-64' />
      </Spin>
    );
  const assignment = query.data;
  const staff = course.data.course.role !== 'student';

  const students = course.data.members.filter(
    (member) => member.role === 'student'
  );

  const current = assignment.submissions.filter(
    (submission) => submission.version === assignment.version
  );

  const rows = students.map((member) => ({
    ...member,
    submission: current.find(
      (submission) => submission.userId === member.userId
    ),
  }));

  const hasDeadlinePassed = Date.parse(assignment.dueAt) < now;

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title={assignment.title}
        description={`${course.data.course.title} · 과제 v${assignment.version} · 원본 v${assignment.source.version}`}
        action={
          <Space>
            <Link
              to='/courses/$courseId'
              params={{ courseId }}>
              수업으로
            </Link>
            {staff && (
              <Button onClick={() => setEditing(true)}>과제 수정</Button>
            )}
          </Space>
        }
      />
      {!assignment.sourceAvailable && (
        <Alert
          type='warning'
          title='현재 원본 자료에 접근할 수 없습니다.'
          description='원본 삭제 또는 접근 권한 변경으로 새 학습·제출·힌트를 이용할 수 없습니다. 기존 제출 결과와 과제 변경 이력은 보존됩니다.'
        />
      )}
      <Card title='과제와 제출 정책'>
        <Descriptions
          column={3}
          items={[
            {
              key: 'source',
              label: '배정 자료',
              children: assignment.source.title,
            },
            {
              key: 'mode',
              label: '학습 모드',
              children:
                assignment.mode === 'reading'
                  ? '읽기 응답'
                  : assignment.mode === 'blank'
                    ? '빈칸 받아쓰기'
                    : '전체 받아쓰기',
            },
            {
              key: 'tasks',
              label: '범위',
              children: assignment.sourceAvailable
                ? `${assignment.source.tasks.length}${assignment.source.kind === 'pdf' ? '페이지' : '구절'}`
                : '현재 원본 접근 불가',
            },
            {
              key: 'due',
              label: '제출 기한',
              children: formatDate(assignment.dueAt),
            },
            {
              key: 'late',
              label: '기한 후 제출',
              children: assignment.allowLate ? '허용' : '불가',
            },
            {
              key: 'resubmit',
              label: '재제출',
              children: assignment.allowResubmit ? '허용' : '불가',
            },
            {
              key: 'hints',
              label: '힌트',
              children: assignment.allowHints ? '허용' : '불가',
            },
            {
              key: 'reveal',
              label: '제출 후 정답',
              children: assignment.revealAfterSubmit ? '공개' : '비공개',
            },
          ]}
        />
      </Card>
      {!staff && (
        <Alert
          type='info'
          title='과제 학습과 제출은 학생 서비스의 수업 화면에서 진행해 주세요.'
          description='이 화면에서는 본인에게 허용된 과제와 제출 기록만 조회합니다.'
        />
      )}
      {staff && (
        <Card
          title={`현재 버전 제출 현황 · ${rows.filter((row) => row.submission).length}/${students.length}명`}>
          <Table
            rowKey='userId'
            dataSource={rows}
            columns={[
              { title: '수강생', render: (_, row) => row.name || '이름 없음' },
              {
                title: '제출 상태',
                render: (_, row) => (
                  <Tag
                    color={
                      row.submission
                        ? row.submission.late
                          ? 'orange'
                          : 'green'
                        : hasDeadlinePassed
                          ? 'red'
                          : undefined
                    }>
                    {row.submission
                      ? row.submission.late
                        ? '기한 후 제출'
                        : '제출 완료'
                      : hasDeadlinePassed
                        ? '미제출 · 기한 경과'
                        : '미제출'}
                  </Tag>
                ),
              },
              {
                title: '제출 시각',
                render: (_, row) =>
                  row.submission
                    ? formatDate(row.submission.createdAt)
                    : '아직 제출하지 않음',
              },
              {
                title: '결과',
                render: (_, row) =>
                  row.submission
                    ? assignment.mode === 'reading'
                      ? '읽기 응답 · 자동 성적 없음'
                      : `${row.submission.result.filter((result) => result.correct).length}/${row.submission.result.length}개 정답`
                    : '결과 없음',
              },
            ]}
          />
        </Card>
      )}
      <Card title='제출·재제출 이력'>
        <Table
          rowKey='id'
          dataSource={assignment.submissions}
          locale={{ emptyText: '제출 이력이 없습니다.' }}
          expandable={{
            expandedRowRender: (submission) => (
              <Space
                orientation='vertical'
                className='w-full'>
                <Typography.Text strong>
                  {submission.assignmentSnapshot.title} · 당시 과제 v
                  {submission.version}
                </Typography.Text>
                {submission.answers.map((answer) => {
                  const result = submission.result.find(
                    (item) => item.id === answer.id
                  );

                  return (
                    <Card
                      size='small'
                      key={answer.id}
                      className='w-full'>
                      <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                        제출 답안:{' '}
                        {Array.isArray(answer.answer)
                          ? answer.answer.join(' / ')
                          : answer.answer}
                      </Typography.Paragraph>
                      <Tag>
                        {result?.correct === null
                          ? '읽기 응답'
                          : result?.correct
                            ? '정답'
                            : '오답'}
                      </Tag>
                      {result?.expected !== undefined &&
                        result.expected !== null && (
                          <Typography.Paragraph
                            className='mt-2! mb-0!'
                            style={{ whiteSpace: 'pre-wrap' }}>
                            당시 정답:{' '}
                            {Array.isArray(result.expected)
                              ? result.expected.join(' / ')
                              : result.expected}
                          </Typography.Paragraph>
                        )}
                    </Card>
                  );
                })}
              </Space>
            ),
          }}
          columns={[
            {
              title: '수강생',
              render: (_, submission) => submission.studentName || '제출자',
            },
            {
              title: '버전',
              dataIndex: 'version',
              render: (version) => (
                <Tag
                  color={version === assignment.version ? 'blue' : undefined}>
                  v{version}
                  {version === assignment.version ? ' · 현재' : ' · 과거'}
                </Tag>
              ),
            },
            {
              title: '기한',
              dataIndex: 'late',
              render: (late) => (late ? '기한 후 제출' : '기한 내 제출'),
            },
            { title: '제출일', dataIndex: 'createdAt', render: formatDate },
          ]}
        />
      </Card>
      {staff && (
        <Card title='과제 변경 이력'>
          <Timeline
            items={assignment.revisions.map((revision) => ({
              content: (
                <Space
                  orientation='vertical'
                  size={4}>
                  <Typography.Text strong>
                    v{revision.version} · {formatDate(revision.createdAt)}
                  </Typography.Text>
                  <Typography.Text>{revision.reason}</Typography.Text>
                </Space>
              ),
            }))}
          />
        </Card>
      )}
      <Alert
        type='warning'
        title='과제를 수정해도 과거 제출의 답안·당시 정답·원본 버전은 변경하지 않습니다.'
        description='현재 버전의 미제출 상태와 이전 버전의 제출 완료를 구분합니다. 개인 학습 기록은 제출 현황에 포함하지 않습니다.'
      />
      {editing && (
        <AssignmentEditor
          courseId={courseId}
          language={course.data.course.language}
          assignment={assignment}
          onClose={() => setEditing(false)}
        />
      )}
    </section>
  );
}

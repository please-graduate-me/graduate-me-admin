import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import { Alert, Button, Card, Space, Typography } from 'antd';
import {
  accessQuery,
  authenticate,
  authStatusQuery,
} from '@/domains/auth/api/auth';
import { ApiError } from '@/lib/api/request';

/** 학생 앱과 별도로 admin 로그인과 역할 확인 상태를 안내한다. */
export const Route = createFileRoute('/login')({ component: Login });

function Login() {
  const status = useQuery(authStatusQuery);
  const access = useQuery(accessQuery);

  const signin = useMutation({
    mutationFn: () => authenticate('signin/google'),
  });

  const signout = useMutation({ mutationFn: () => authenticate('signout') });

  if (access.data?.role)
    return (
      <Navigate
        to={access.data.role === 'admin' ? '/' : '/questions'}
        replace
      />
    );

  return (
    <main className='flex min-h-dvh items-center justify-center p-10'>
      <Card className='w-[480px]'>
        <Space
          orientation='vertical'
          size={20}
          className='w-full'>
          <div>
            <Typography.Text type='secondary'>
              graduate me / admin
            </Typography.Text>
            <Typography.Title level={2}>학습 운영 작업 공간</Typography.Title>
            <Typography.Paragraph type='secondary'>
              학과 답변 도우미와 운영 관리자, 수업 담당자는 Google 계정으로
              로그인해 주세요.
            </Typography.Paragraph>
          </div>
          {access.data && !access.data.role && (
            <Link to='/courses'>수업 · 과제 관리로 이동</Link>
          )}
          {access.data && !access.data.role && (
            <Alert
              type='warning'
              title='학과 도우미·전체 운영 권한이 없는 계정입니다.'
              description='수업 관리는 위 링크에서 이용할 수 있습니다. 학과 도우미 배정은 운영 관리자에게 요청해 주세요.'
            />
          )}
          {status.data && !status.data.configured && (
            <Alert
              type='info'
              title='Google 로그인이 아직 설정되지 않았습니다.'
            />
          )}
          {status.error && (
            <Alert
              type='error'
              title={status.error.message}
              action={
                <Button onClick={() => status.refetch()}>다시 확인</Button>
              }
            />
          )}
          {access.error &&
            !(
              access.error instanceof ApiError && access.error.status === 401
            ) && (
              <Alert
                type='error'
                title={access.error.message}
                action={
                  <Button onClick={() => access.refetch()}>
                    권한 다시 확인
                  </Button>
                }
              />
            )}
          {(signin.error || signout.error) && (
            <Alert
              type='error'
              title={(signin.error || signout.error)?.message}
            />
          )}
          <Button
            type='primary'
            block
            disabled={!status.data?.configured || access.isPending}
            loading={signin.isPending || status.isPending}
            onClick={() => signin.mutate()}>
            Google 계정으로 로그인
          </Button>
          {access.data && (
            <Button
              block
              loading={signout.isPending}
              onClick={() => signout.mutate()}>
              현재 계정 로그아웃
            </Button>
          )}
        </Space>
      </Card>
    </main>
  );
}

import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Navigate } from '@tanstack/react-router';
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
              학과 답변 도우미와 운영 관리자는 배정된 계정으로 로그인해 주세요.
            </Typography.Paragraph>
          </div>
          {access.data && !access.data.role && (
            <Alert
              type='warning'
              title='이 계정에는 admin 접근 권한이 없습니다.'
              description='운영 관리자에게 담당 언어와 자료 배정을 요청해 주세요.'
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

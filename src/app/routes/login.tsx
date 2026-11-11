import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Navigate } from '@tanstack/react-router';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { accessQuery, login, authStatusQuery } from '@/domains/auth/api/auth';

/** 운영 콘솔은 일반 사용자 로그인과 독립된 아이디·비밀번호로만 진입한다. */
export const Route = createFileRoute('/login')({ component: Login });

function Login() {
  const client = useQueryClient();
  const navigate = Route.useNavigate();
  const status = useQuery(authStatusQuery);
  const access = useQuery(accessQuery);

  const signin = useMutation({
    mutationFn: (values: { username: string; password: string }) =>
      login(values.username, values.password),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: accessQuery.queryKey });
      await client.fetchQuery(accessQuery);
      await navigate({ to: '/', replace: true });
    },
  });

  if (access.data?.role === 'admin')
    return (
      <Navigate
        to='/'
        replace
      />
    );

  return (
    <main className='flex min-h-dvh items-center justify-center p-10'>
      <Card className='w-[480px]'>
        <Typography.Text type='secondary'>graduate me / admin</Typography.Text>
        <Typography.Title level={2}>운영자 로그인</Typography.Title>
        <Typography.Paragraph type='secondary'>
          운영자 아이디와 비밀번호를 입력해 주세요. 일반 사용자와 조교는 서비스
          웹을 이용합니다.
        </Typography.Paragraph>
        {status.data && !status.data.configured && (
          <Alert
            type='info'
            title='운영자 인증 설정이 필요합니다.'
            className='mb-4!'
          />
        )}
        {(status.error || signin.error) && (
          <Alert
            type='error'
            title={(status.error || signin.error)?.message}
            className='mb-4!'
          />
        )}
        <Form
          layout='vertical'
          onFinish={(values) => signin.mutate(values)}>
          <Form.Item
            name='username'
            label='관리자 아이디'
            rules={[{ required: true, message: '아이디를 입력해 주세요.' }]}>
            <Input
              autoComplete='username'
              maxLength={128}
              disabled={signin.isPending}
            />
          </Form.Item>
          <Form.Item
            name='password'
            label='비밀번호'
            rules={[{ required: true, message: '비밀번호를 입력해 주세요.' }]}>
            <Input.Password
              autoComplete='current-password'
              maxLength={256}
              disabled={signin.isPending}
            />
          </Form.Item>
          <Button
            type='primary'
            htmlType='submit'
            block
            loading={signin.isPending}
            disabled={!status.data?.configured}>
            로그인
          </Button>
        </Form>
      </Card>
    </main>
  );
}

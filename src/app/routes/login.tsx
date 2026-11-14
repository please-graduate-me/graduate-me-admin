import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Banner } from '@astryxdesign/core/Banner';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import Form from 'rc-field-form';
import { FormField } from '@/components/ui/FormField';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Navigate } from '@tanstack/react-router';
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
      <Card
        className='w-full max-w-[480px]'
        padding={5}>
        <Text color='secondary'>graduate me / admin</Text>
        <Heading level={2}>운영자 로그인</Heading>
        <Text
          as='p'
          color='secondary'>
          운영자 아이디와 비밀번호를 입력해 주세요. 일반 사용자와 조교는 서비스
          웹을 이용합니다.
        </Text>
        {status.data && !status.data.configured && (
          <Banner
            status='info'
            title='운영자 인증 설정이 필요합니다.'
            className='mb-4!'
          />
        )}
        {(status.error || signin.error) && (
          <Banner
            status='error'
            title={(status.error || signin.error)?.message}
            className='mb-4!'
          />
        )}
        <Form
          className='flex flex-col gap-4'
          onFinish={(values) => signin.mutate(values)}>
          <FormField
            name='username'
            label='관리자 아이디'
            rules={[
              { required: true, message: '아이디를 입력해 주세요.' },
              { max: 128, message: '아이디는 128자 이내로 입력해 주세요.' },
            ]}>
            <TextInput
              autoComplete='username'
              isDisabled={signin.isPending}
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
          <FormField
            name='password'
            label='비밀번호'
            rules={[
              { required: true, message: '비밀번호를 입력해 주세요.' },
              { max: 256, message: '비밀번호는 256자 이내로 입력해 주세요.' },
            ]}>
            <TextInput
              autoComplete='current-password'
              isDisabled={signin.isPending}
              type='password'
              label='입력'
              isLabelHidden
              value={''}
            />
          </FormField>
          <Button
            type='submit'
            isLoading={signin.isPending}
            isDisabled={!status.data?.configured}
            variant='primary'
            width='100%'
            label='로그인'
          />
        </Form>
      </Card>
    </main>
  );
}

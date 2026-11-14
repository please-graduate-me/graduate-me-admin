import { FormProvider } from 'rc-field-form';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import koKR from '@astryxdesign/core/locales/ko-KR.generated.js';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Theme } from '@astryxdesign/core/theme';
import { ToastViewport } from '@astryxdesign/core/Toast';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { queryClient } from './queryClient';
import { router } from './router';

/** 관리자 앱의 데이터·라우팅과 Astryx 테마·알림을 연결한다. */
export function App() {
  return (
    <Theme
      theme={neutralTheme}
      mode='light'>
      <InternationalizationProvider
        locale='ko-KR'
        messages={{ 'ko-KR': koKR }}>
        <FormProvider
          validateMessages={{
            default: '입력값을 확인해 주세요.',
            required: '값을 입력해 주세요.',
            whitespace: '공백만 입력할 수 없습니다.',
            string: { max: '최대 ${max}자까지 입력해 주세요.' },
            types: {
              email: '올바른 이메일 주소를 입력해 주세요.',
              url: '올바른 주소를 입력해 주세요.',
              number: '숫자를 입력해 주세요.',
            },
            number: { min: '${min} 이상의 숫자를 입력해 주세요.' },
          }}>
          <ToastViewport>
            <QueryClientProvider client={queryClient}>
              <RouterProvider router={router} />
            </QueryClientProvider>
          </ToastViewport>
        </FormProvider>
      </InternationalizationProvider>
    </Theme>
  );
}

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
      <ToastViewport>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ToastViewport>
    </Theme>
  );
}

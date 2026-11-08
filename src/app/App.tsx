import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { App as AntApp, ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { queryClient } from './queryClient';
import { router } from './router';
import { adminTheme } from './theme';

/** 관리자 앱의 데이터·라우팅·공통 디자인 설정을 연결한다. */
export function App() {
  return (
    <StyleProvider layer>
      <ConfigProvider
        locale={koKR}
        theme={adminTheme}>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>
    </StyleProvider>
  );
}

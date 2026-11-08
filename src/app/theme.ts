import type { ThemeConfig } from 'antd';

/** 관리자 화면의 공통 외형과 CSS 변수 기준을 정의한다. */
export const adminTheme: ThemeConfig = {
  cssVar: { key: 'admin' },
  token: {
    colorPrimary: '#254fca',
    borderRadius: 8,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  components: {
    Layout: { headerBg: '#ffffff', siderBg: '#ffffff' },
  },
};

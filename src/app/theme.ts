import type { ConfigProviderProps, ThemeConfig } from 'antd';

/** admin 탐색 색상을 Ant Design 테마와 같은 위치에서 관리한다. */
export const adminNavigation = {
  background: '#17223b',
  selected: '#2c3e62',
  hover: '#22314f',
  muted: '#a8b5ce',
};

/** 카드 제목과 본문은 Figma의 한 패널 안에서 연속된 위계로 표시한다. */
export const adminCardConfig: NonNullable<ConfigProviderProps['card']> = {
  styles: {
    header: { borderBottom: 0, padding: '20px 20px 0', minHeight: 48 },
    body: { padding: 20 },
  },
};

/** 목록의 제목 행은 본문보다 작은 12px 위계로 표시한다. */
export const adminTableConfig: NonNullable<ConfigProviderProps['table']> = {
  styles: { header: { cell: { fontSize: 12, fontWeight: 400 } } },
};

/** 관리자 화면의 공통 외형과 CSS 변수 기준을 정의한다. */
export const adminTheme: ThemeConfig = {
  cssVar: { key: 'admin' },
  token: {
    colorPrimary: '#254fca',
    colorPrimaryHover: '#3d65df',
    colorPrimaryActive: '#1d3fa5',
    colorPrimaryBg: '#edf2ff',
    colorInfo: '#254fca',
    colorInfoBg: '#edf2ff',
    colorSuccess: '#237804',
    colorSuccessBg: '#f6ffed',
    colorWarning: '#ad6800',
    colorWarningBg: '#fffbe6',
    colorError: '#a8071a',
    colorErrorBg: '#fff1f0',
    colorText: '#1f2329',
    colorTextSecondary: '#667085',
    colorBorder: '#e4e7ec',
    colorBorderSecondary: '#e4e7ec',
    colorBgLayout: '#f5f6f8',
    colorBgContainer: '#ffffff',
    colorFillAlter: '#f5f6f8',
    colorTextDisabled: '#98a2b3',
    colorBgContainerDisabled: '#f5f6f8',
    borderRadius: 8,
    controlHeight: 36,
    fontSize: 14,
    lineHeight: 1.5714285714,
    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
    fontFamilyCode: "'Inter', system-ui, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: adminNavigation.background,
      headerHeight: 64,
      headerPadding: '0 28px',
    },
    Menu: {
      darkItemBg: adminNavigation.background,
      darkItemSelectedBg: adminNavigation.selected,
      darkItemHoverBg: adminNavigation.hover,
      darkItemColor: adminNavigation.muted,
      darkItemSelectedColor: '#ffffff',
      darkGroupTitleColor: adminNavigation.muted,
      itemHeight: 42,
      itemMarginBlock: 8,
      itemMarginInline: 0,
      itemPaddingInline: 12,
      itemBorderRadius: 8,
      iconSize: 20,
      groupTitleFontSize: 12,
    },
    Typography: { titleMarginTop: 0, titleMarginBottom: 4 },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      paddingInline: 20,
      defaultHoverColor: '#1f2329',
      defaultHoverBorderColor: '#e4e7ec',
      defaultHoverBg: '#ffffff',
      defaultActiveColor: '#1f2329',
      defaultActiveBorderColor: '#e4e7ec',
      defaultActiveBg: '#ffffff',
      textHoverBg: '#ffffff',
      textTextHoverColor: '#1f2329',
      colorBgTextActive: '#ffffff',
      textTextActiveColor: '#1f2329',
    },
    Input: {
      activeBorderColor: '#254fca',
      activeShadow: '0 0 0 1px #254fca',
      errorActiveShadow: '0 0 0 1px #a8071a',
    },
    Card: {
      bodyPadding: 20,
      headerHeight: 60,
      headerFontSize: 18,
      boxShadowTertiary: 'none',
    },
    Table: {
      headerBg: '#f5f6f8',
      headerColor: '#667085',
      rowHoverBg: '#edf2ff',
      rowSelectedBg: '#edf2ff',
      cellPaddingBlock: 21,
      cellPaddingInline: 12,
      headerBorderRadius: 8,
    },
    Tag: { defaultBg: '#f5f6f8', defaultColor: '#667085', borderRadiusSM: 4 },
    Statistic: {
      contentFontSize: 30,
      titleFontSize: 12,
      fontFamily: "'Inter', 'Noto Sans KR', sans-serif",
    },
    Tabs: {
      itemSelectedColor: '#254fca',
      inkBarColor: '#254fca',
      itemColor: '#667085',
      horizontalItemPadding: '11px 12px',
      horizontalItemGutter: 8,
    },
  },
};

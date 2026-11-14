import { Icon, type IconName } from '@astryxdesign/core/Icon';

const icons: Record<string, IconName> = {
  'layout-grid': 'viewColumns',
  'file-text': 'copy',
  'message-circle': 'info',
  flag: 'warning',
  users: 'viewColumns',
  'chart-no-axes-column': 'arrowsUpDown',
  clock: 'clock',
};

/** 업무 메뉴 아이콘을 Astryx 의미 아이콘과 현재 선택 색상으로 표시한다. */
export function SidebarIcon({
  name,
  selected = false,
}: {
  name: string;
  selected?: boolean;
}) {
  return (
    <Icon
      icon={icons[name] ?? 'info'}
      color={selected ? 'accent' : 'secondary'}
      size='md'
    />
  );
}

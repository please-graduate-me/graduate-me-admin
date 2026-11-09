type Props = { name: string; selected?: boolean };

/** Figma의 20px 원본 아이콘을 탐색 영역의 현재 상태로 표시한다. */
export function SidebarIcon({ name, selected = false }: Props) {
  return (
    <img
      src={`/icons/${name}.svg`}
      alt=''
      width={20}
      height={20}
      className='shrink-0'
      style={{ filter: selected ? 'brightness(0) invert(1)' : undefined }}
    />
  );
}

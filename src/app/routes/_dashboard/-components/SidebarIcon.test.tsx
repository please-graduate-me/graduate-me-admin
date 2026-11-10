import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { SidebarIcon } from './SidebarIcon';

afterEach(() => vi.unstubAllEnvs());

it.each(['/', '/admin/'])('%s 배포 경로에서 로컬 아이콘을 참조한다', (base) => {
  vi.stubEnv('BASE_URL', base);

  const html = renderToStaticMarkup(
    <SidebarIcon
      name='message-circle'
      selected
    />
  );

  expect(html).toContain(`src="${base}icons/message-circle.svg"`);
  expect(html).not.toContain('https://');
});

import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { SidebarIcon } from './SidebarIcon';

it.each(['/', '/admin/'])(
  '%s 배포에서도 메뉴 아이콘은 외부 파일 요청 없이 표시한다',
  () => {
    const html = renderToStaticMarkup(
      <SidebarIcon
        name='message-circle'
        selected
      />
    );

    expect(html).toContain('<svg');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('https://');
  }
);

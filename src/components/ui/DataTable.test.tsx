import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { DataTable } from './DataTable';

it('서버가 반환한 두 번째 페이지를 클라이언트에서 다시 자르지 않는다', () => {
  const html = renderToStaticMarkup(
    <DataTable
      dataSource={[{ id: 'next', name: '서버의 다음 결과' }]}
      rowKey='id'
      pagination={{ mode: 'server', current: 2, pageSize: 20, total: 21 }}
      columns={[{ title: '이름', dataIndex: 'name' }]}
    />
  );

  expect(html).toContain('서버의 다음 결과');
  expect(html).toContain('목록 페이지');
});

it('전체 결과를 가진 로컬 목록은 선택한 페이지 범위만 표시한다', () => {
  const html = renderToStaticMarkup(
    <DataTable
      dataSource={[
        { id: 1, name: '이전 결과' },
        { id: 2, name: '선택한 결과' },
      ]}
      rowKey='id'
      pagination={{ mode: 'client', current: 2, pageSize: 1 }}
      columns={[{ title: '이름', dataIndex: 'name' }]}
    />
  );

  expect(html).not.toContain('이전 결과');
  expect(html).toContain('선택한 결과');
});

it('조회 중과 실제 빈 결과를 구분한다', () => {
  const columns = [{ title: '이름', dataIndex: 'name' as const }];

  const pending = renderToStaticMarkup(
    <DataTable<{ name: string }>
      dataSource={[]}
      columns={columns}
      loading
      locale={{ emptyText: '실제 빈 결과' }}
    />
  );

  const empty = renderToStaticMarkup(
    <DataTable<{ name: string }>
      dataSource={[]}
      columns={columns}
      locale={{ emptyText: '실제 빈 결과' }}
    />
  );

  expect(pending).toContain('목록 불러오는 중');
  expect(pending).not.toContain('실제 빈 결과');
  expect(empty).toContain('실제 빈 결과');
});

it('조교가 21명인 로컬 목록은 20명과 마지막 1명을 페이지별로 나눈다', () => {
  const helpers = Array.from({ length: 21 }, (_, index) => ({
    userId: String(index + 1),
    name:
      index === 0
        ? '첫째 조교'
        : index === 20
          ? '마지막 조교'
          : `중간 조교 ${index}`,
  }));

  const columns = [{ title: '조교', dataIndex: 'name' as const }];

  const first = renderToStaticMarkup(
    <DataTable
      dataSource={helpers}
      rowKey='userId'
      columns={columns}
      pagination={{ mode: 'client', current: 1, pageSize: 20 }}
    />
  );

  const second = renderToStaticMarkup(
    <DataTable
      dataSource={helpers}
      rowKey='userId'
      columns={columns}
      pagination={{ mode: 'client', current: 2, pageSize: 20 }}
    />
  );

  expect(first).toContain('첫째 조교');
  expect(first).not.toContain('마지막 조교');
  expect(second).not.toContain('첫째 조교');
  expect(second).not.toContain('중간 조교');
  expect(second).toContain('마지막 조교');
});

it('필터로 로컬 목록이 줄면 남아 있는 마지막 페이지를 표시한다', () => {
  const html = renderToStaticMarkup(
    <DataTable
      dataSource={[{ id: 1, name: '남은 조교' }]}
      rowKey='id'
      columns={[{ title: '조교', dataIndex: 'name' }]}
      pagination={{ mode: 'client', current: 3, pageSize: 20 }}
    />
  );

  expect(html).toContain('남은 조교');
});

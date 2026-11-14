import { Fragment, useState, type Key, type ReactNode } from 'react';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@astryxdesign/core/Table';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Button } from '@astryxdesign/core/Button';
import { Spinner } from '@astryxdesign/core/Spinner';
import { EmptyState } from '@astryxdesign/core/EmptyState';

type ColumnBase = {
  title: ReactNode;
  key?: Key;
  width?: number | string;
  align?: string;
  ellipsis?: boolean;
};
type Column<T> =
  | {
      [K in keyof T]: ColumnBase & {
        dataIndex: K;
        render?: (value: T[K], item: T, index: number) => ReactNode;
      };
    }[keyof T]
  | (ColumnBase & {
      dataIndex?: undefined;
      render?: (value: undefined, item: T, index: number) => ReactNode;
    });
type Paging = {
  current?: number;
  pageSize?: number;
  total?: number;
  showSizeChanger?: boolean;
  hideOnSinglePage?: boolean;
  onChange?: (page: number) => void;
};

/** 운영 목록의 서버·로컬 페이지와 확장 오류 상세를 Astryx 표에 연결한다. */
export function DataTable<T extends Record<string, unknown>>({
  dataSource,
  columns,
  pagination = false,
  loading,
  locale,
  rowKey,
  size,
  className,
  scroll,
  expandable,
}: {
  dataSource: T[];
  columns: Column<T>[];
  pagination?: false | Paging;
  loading?: boolean;
  locale?: {
    emptyText?: ReactNode;
  };
  rowKey?: keyof T | ((item: T, index: number) => Key);
  size?: string;
  className?: string;
  scroll?: {
    x?: number | string;
    y?: number | string;
  };
  expandable?: {
    rowExpandable?: (item: T) => boolean;
    expandedRowRender: (item: T) => ReactNode;
  };
}) {
  const [localPage, setLocalPage] = useState(1);
  const [expanded, setExpanded] = useState<Key[]>([]);
  const page = pagination ? (pagination.current ?? localPage) : 1;
  const pageSize = pagination ? (pagination.pageSize ?? 20) : dataSource.length;

  const total = pagination
    ? (pagination.total ?? dataSource.length)
    : dataSource.length;

  // 서버 집계가 있는 표는 이미 잘린 결과를 다시 자르지 않는다.
  const rows =
    pagination && pagination.total === undefined
      ? dataSource.slice((page - 1) * pageSize, page * pageSize)
      : dataSource;

  return (
    <div
      className={className}
      aria-busy={loading || undefined}>
      {loading ? (
        <Spinner label='목록 불러오는 중' />
      ) : rows.length === 0 ? (
        (locale?.emptyText ?? <EmptyState title='조회할 항목이 없습니다.' />)
      ) : (
        <div
          className='overflow-auto'
          style={scroll?.y ? { maxHeight: scroll.y } : undefined}>
          <Table
            density={size === 'small' ? 'compact' : 'balanced'}
            hasHover>
            <TableHeader>
              <TableRow isHeaderRow>
                {columns.map((column, index) => (
                  <TableHeaderCell
                    key={column.key ?? String(column.dataIndex ?? index)}
                    scope='col'
                    style={{ width: column.width }}>
                    {column.title}
                  </TableHeaderCell>
                ))}
                {expandable && (
                  <TableHeaderCell scope='col'>상세</TableHeaderCell>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item, index) => {
                const key =
                  typeof rowKey === 'function'
                    ? rowKey(item, index)
                    : rowKey
                      ? (item[rowKey] as Key)
                      : index;

                const isExpanded = expanded.includes(key);

                return (
                  <Fragment key={key}>
                    <TableRow>
                      {columns.map((column, cellIndex) => {
                        const value =
                          column.dataIndex === undefined
                            ? undefined
                            : item[column.dataIndex];

                        const render = column.render as
                          | ((
                              value: unknown,
                              item: T,
                              index: number
                            ) => ReactNode)
                          | undefined;

                        return (
                          <TableCell
                            key={
                              column.key ??
                              String(column.dataIndex ?? cellIndex)
                            }>
                            {render
                              ? render(value, item, index)
                              : (value as ReactNode)}
                          </TableCell>
                        );
                      })}
                      {expandable && (
                        <TableCell>
                          {(!expandable.rowExpandable ||
                            expandable.rowExpandable(item)) && (
                            <Button
                              label={isExpanded ? '상세 닫기' : '상세 보기'}
                              variant='ghost'
                              size='sm'
                              aria-expanded={isExpanded}
                              onClick={() =>
                                setExpanded((current) =>
                                  isExpanded
                                    ? current.filter((value) => value !== key)
                                    : [...current, key]
                                )
                              }
                            />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    {expandable && isExpanded && (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1}>
                          {expandable.expandedRowRender(item)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {pagination &&
        total > 0 &&
        !(pagination.hideOnSinglePage && total <= pageSize) && (
          <Pagination
            label='목록 페이지'
            page={page}
            pageSize={pageSize}
            totalItems={total}
            onChange={(next) => {
              setLocalPage(next);
              pagination.onChange?.(next);
            }}
          />
        )}
    </div>
  );
}

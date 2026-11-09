import { Input, Select } from 'antd';
import type { ListSearch } from './listSearch';

/** 검색·상태·기간 필터를 URL을 소유하는 목록 화면에 연결한다. */
export function ListFilters({
  value,
  onChange,
  placeholder = '제목 또는 번호 검색',
  statuses,
  showPeriod = true,
  allStatusLabel = '전체 상태',
}: {
  value: ListSearch;
  onChange: (patch: Partial<ListSearch>) => void;
  placeholder?: string;
  statuses?: { value: string; label: string }[];
  showPeriod?: boolean;
  allStatusLabel?: string;
}) {
  return (
    <div className='flex items-center gap-3'>
      <Input.Search
        maxLength={100}
        value={value.q}
        onChange={(event) => onChange({ q: event.target.value, page: 1 })}
        onSearch={(q) => onChange({ q, page: 1 })}
        placeholder={placeholder}
        aria-label={placeholder}
        className='w-80!'
        allowClear
      />
      {statuses && (
        <Select
          value={value.status}
          onChange={(status) => onChange({ status, page: 1 })}
          options={[{ value: 'all', label: allStatusLabel }, ...statuses]}
          className='w-40!'
          aria-label='상태 필터'
        />
      )}
      {showPeriod && (
        <Select
          value={value.period}
          onChange={(period) => onChange({ period, page: 1 })}
          options={[
            { value: 'all', label: '전체 기간' },
            { value: '7', label: '최근 7일' },
            { value: '30', label: '최근 30일' },
          ]}
          className='w-36!'
          aria-label='기간 필터'
        />
      )}
    </div>
  );
}

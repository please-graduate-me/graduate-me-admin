import { useState } from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { Button } from '@astryxdesign/core/Button';
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
  statuses?: {
    value: string;
    label: string;
  }[];
  showPeriod?: boolean;
  allStatusLabel?: string;
}) {
  const [query, setQuery] = useState({ source: value.q, draft: value.q });
  const draft = query.source === value.q ? query.draft : value.q;

  return (
    <form
      className='flex items-center gap-3'
      onSubmit={(event) => {
        event.preventDefault();
        const q = new FormData(event.currentTarget).get('q');

        onChange({ q: typeof q === 'string' ? q : '', page: 1 });
      }}>
      <TextInput
        key={value.q}
        htmlName='q'
        onChange={(draft) =>
          setQuery({ source: value.q, draft: draft.slice(0, 100) })
        }
        placeholder={placeholder}
        aria-label={placeholder}
        containerClassName='w-80!'
        hasClear
        label={placeholder}
        isLabelHidden
        value={draft}
      />
      {statuses && (
        <Selector
          value={value.status}
          onChange={(status) => onChange({ status, page: 1 })}
          options={[{ value: 'all', label: allStatusLabel }, ...statuses]}
          containerClassName='w-40!'
          aria-label='상태 필터'
          label={'상태 필터'}
          isLabelHidden
        />
      )}
      {showPeriod && (
        <Selector
          value={value.period}
          onChange={(period) =>
            onChange({
              period: period === '7' || period === '30' ? period : 'all',
              page: 1,
            })
          }
          options={[
            { value: 'all', label: '전체 기간' },
            { value: '7', label: '최근 7일' },
            { value: '30', label: '최근 30일' },
          ]}
          containerClassName='w-36!'
          aria-label='기간 필터'
          label={'기간 필터'}
          isLabelHidden
        />
      )}
      <div className='flex-1' />
      <Button
        type='submit'
        className='w-33!'
        variant='primary'
        label='검색'
      />
    </form>
  );
}

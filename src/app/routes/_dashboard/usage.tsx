import { createFileRoute, redirect } from '@tanstack/react-router';
import type { SearchSchemaInput } from '@tanstack/react-router';
import { Tabs } from 'antd';
import { PageHeading } from './-components/PageHeading';
import { parseListSearch, type ListSearch } from './-components/listSearch';
import { AIUsageLedger } from './usage/-components/AIUsageLedger';
import { ProcessingJobs } from './usage/-components/ProcessingJobs';

const parseUsageSearch = (
  raw: Partial<ListSearch> & {
    view?: string;
    provider?: string;
  } & SearchSchemaInput
) => ({
  ...parseListSearch(raw),
  view: raw.view === 'jobs' ? 'jobs' : 'ai',
  provider:
    raw.provider === 'naver' || raw.provider === 'gemini'
      ? raw.provider
      : 'all',
});

/** 실제 AI 사용량과 자료 준비 큐 이력을 구분해 운영 화면에 연결한다. */
export const Route = createFileRoute('/_dashboard/usage')({
  validateSearch: parseUsageSearch,
  beforeLoad: ({ context }) => {
    if (context.access.role !== 'admin') throw redirect({ to: '/questions' });
  },
  component: Usage,
});

function Usage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const change = (patch: Partial<ListSearch>) =>
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
    });

  return (
    <section className='flex flex-col gap-5'>
      <PageHeading
        title='AI 사용량 · 처리 이력'
        description='공급자별 실제 요청·토큰·응답 시간과 자료 준비 상태를 확인합니다.'
      />
      <Tabs
        activeKey={search.view}
        onChange={(view) =>
          void navigate({
            search: (previous) => ({
              ...previous,
              view,
              status: 'all',
              page: 1,
              q: '',
            }),
            replace: true,
          })
        }
        items={[
          {
            key: 'ai',
            label: 'AI 실행 기록',
            children: (
              <AIUsageLedger
                search={search}
                provider={search.provider}
                onChange={change}
                onProvider={(provider) =>
                  void navigate({
                    search: (previous) => ({ ...previous, provider, page: 1 }),
                    replace: true,
                  })
                }
              />
            ),
          },
          {
            key: 'jobs',
            label: '영상 준비 큐',
            children: (
              <ProcessingJobs
                search={search}
                onChange={change}
              />
            ),
          },
        ]}
      />
    </section>
  );
}

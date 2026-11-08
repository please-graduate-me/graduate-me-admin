/** 운영 기능이 연결될 관리자 앱의 기본 진입 화면을 제공한다. */
export function App() {
  return (
    <div className='min-h-dvh bg-canvas text-ink'>
      <header className='flex items-center gap-4 border-b border-line bg-surface px-6 py-4'>
        <span className='text-xl font-bold'>graduate me</span>
        <span className='text-sm text-accent'>운영 관리</span>
      </header>
      <main className='mx-auto max-w-280 px-6 py-6 sm:py-12 lg:py-16'>
        <h1 className='text-2xl font-bold sm:text-3xl'>관리자 작업 공간</h1>
        <p className='mt-2 text-muted'>
          서비스 운영에 필요한 작업을 한곳에서 관리합니다.
        </p>
        <section
          className='mt-8 grid gap-2 rounded-xl border border-line bg-surface p-6'
          aria-labelledby='workspace-status'>
          <h2
            id='workspace-status'
            className='text-lg font-semibold'>
            관리 메뉴를 준비하고 있습니다
          </h2>
          <p className='text-muted'>
            관리 기능이 연결되면 이곳에서 확인할 수 있습니다.
          </p>
        </section>
      </main>
    </div>
  );
}

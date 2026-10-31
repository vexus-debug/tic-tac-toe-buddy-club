// Theme-aware skeleton shown while a page is loading (replaces the blank flash).
export function PageSkeleton() {
  const bar = "page-skeleton-bar rounded-md";
  return (
    <div className="page-skeleton flex min-h-screen w-full" aria-busy="true" aria-label="Loading">
      <aside className="page-skeleton-panel hidden w-60 shrink-0 flex-col gap-3 p-4 md:flex">
        <div className={`${bar} mb-4 h-8 w-32`} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${bar} h-6 w-full`} />
        ))}
      </aside>
      <main className="flex flex-1 flex-col gap-5 p-4 md:p-8">
        <div className={`${bar} h-10 w-full max-w-md`} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${bar} h-24`} />
          ))}
        </div>
        <div className={`${bar} h-64 w-full`} />
        <div className={`${bar} h-40 w-full`} />
      </main>
    </div>
  );
}

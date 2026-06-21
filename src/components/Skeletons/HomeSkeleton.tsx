// components/Skeletons/HomeSkeleton.tsx

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10 ${className}`}
    />
  );
}

export default function HomeSkeleton() {
  return (
    <main className="min-h-screen bg-[#F6F6F6] px-4 pb-20 pt-4 dark:bg-[#00091A] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <SkeletonBlock className="h-44 w-full rounded-3xl sm:h-52" />

        <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#020B1F] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-16 w-16 rounded-full" />

              <div className="space-y-3">
                <SkeletonBlock className="h-5 w-44" />
                <SkeletonBlock className="h-4 w-64 max-w-full" />
              </div>
            </div>

            <SkeletonBlock className="h-11 w-full sm:w-40" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-20" />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
          <SkeletonBlock className="h-80" />
          <SkeletonBlock className="h-80" />
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SkeletonBlock className="h-72" />
          <SkeletonBlock className="h-72" />
        </section>
      </div>
    </main>
  );
}
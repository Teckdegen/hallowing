function Bone({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`skeleton rounded-2xl ${className}`} style={style} />;
}

function CommentsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      <div className="shrink-0 px-4 pt-4 pb-2">
        <Bone className="h-4 w-20 rounded-md" />
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-hidden px-4 pt-2">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex gap-3">
            <Bone className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 pt-0.5">
              <Bone className="h-3 w-24 rounded-md" />
              <Bone className={`mt-2 h-3 rounded-md ${index % 2 ? "w-3/5" : "w-4/5"}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-line px-4 py-3">
        <Bone className="h-10 flex-1 rounded-full" />
        <Bone className="h-10 w-16 rounded-full" />
      </div>
    </>
  );
}

function TileSkeleton({ wide = false, creator = true }: { wide?: boolean; creator?: boolean }) {
  return (
    <div>
      <Bone className={`rounded-xl ${wide ? "aspect-video" : "aspect-[3/4]"}`} />
      <Bone className="mt-2 h-3.5 w-4/5 rounded-md" />
      {creator ? (
        <div className="mt-2 flex items-center gap-1.5">
          <Bone className="size-5 rounded-full" />
          <Bone className="h-3 w-20 rounded-md" />
        </div>
      ) : (
        <Bone className="mt-2 h-3 w-1/3 rounded-md" />
      )}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="h-[calc(100dvh-3.5rem)] min-h-0 xl:grid xl:grid-cols-[minmax(0,1fr)_300px]" aria-busy="true" aria-label="Loading videos">
      <div className="relative h-full overflow-hidden bg-black">
        <div className="skeleton absolute inset-0 rounded-none opacity-60" />
        <div className="absolute top-1/2 right-[max(0.75rem,env(safe-area-inset-right))] flex -translate-y-1/2 flex-col items-center gap-4 sm:right-5">
          <Bone className="size-12 rounded-full" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <Bone className="size-9 rounded-full" />
              <Bone className="h-2.5 w-7 rounded-md" />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-3 bottom-4 max-w-[calc(100%-5.5rem)] sm:inset-x-5 sm:bottom-6">
          <Bone className="h-4 w-28 rounded-md" />
          <Bone className="mt-2.5 h-3.5 w-64 max-w-full rounded-md" />
          <Bone className="mt-2 h-3 w-40 rounded-md" />
          <Bone className="mt-4 h-8 w-20 rounded-full" />
        </div>
      </div>
      <div className="hidden min-h-0 flex-col border-l border-line xl:flex">
        <CommentsSkeleton />
      </div>
    </div>
  );
}

export function BrowseSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6" aria-busy="true" aria-label="Loading explore">
      <Bone className="h-8 w-32 rounded-md" />
      <div className="mt-4 flex gap-2 overflow-hidden">
        {[12, 20, 16, 24, 14, 18].map((width, index) => (
          <Bone key={index} className="h-8 shrink-0 rounded-lg" style={{ width: `${width * 4}px` }} />
        ))}
      </div>
      <Bone className="mt-8 h-4 w-20 rounded-md" />
      <div className="mt-3 flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex w-36 shrink-0 flex-col items-center rounded-2xl border border-line bg-card px-3 pt-5 pb-4 sm:w-40">
            <Bone className="size-16 rounded-full" />
            <Bone className="mt-3 h-3.5 w-20 rounded-md" />
            <Bone className="mt-1.5 h-3 w-16 rounded-md" />
            <Bone className="mt-2.5 h-3 w-14 rounded-md" />
            <Bone className="mt-3 h-8 w-full rounded-full" />
          </div>
        ))}
      </div>
      <Bone className="mt-8 h-4 w-16 rounded-md" />
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <TileSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}

export function WatchSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start" aria-busy="true" aria-label="Loading video">
      <div className="min-w-0">
        <div className="bg-black">
          <Bone className="aspect-video w-full rounded-none opacity-70" />
        </div>
        <div className="flex flex-col gap-5 px-4 py-5 lg:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Bone className="h-7 w-2/3 rounded-md" />
              <div className="mt-3 flex items-center gap-3">
                <Bone className="size-10 rounded-full" />
                <div>
                  <Bone className="h-3.5 w-28 rounded-md" />
                  <Bone className="mt-1.5 h-3 w-20 rounded-md" />
                </div>
              </div>
            </div>
            <Bone className="mt-1 h-9 w-28 shrink-0 rounded-full" />
          </div>
          <div className="flex gap-2">
            {[16, 20, 14].map((width, index) => (
              <Bone key={index} className="h-6 rounded-full" style={{ width: `${width * 4}px` }} />
            ))}
          </div>
          <div className="rounded-2xl bg-card px-4 py-4">
            <Bone className="h-3 w-24 rounded-md" />
            <Bone className="mt-3 h-3.5 w-full max-w-xl rounded-md" />
            <Bone className="mt-2 h-3.5 w-3/5 max-w-md rounded-md" />
          </div>
          <div className="mt-3">
            <Bone className="h-3 w-36 rounded-md" />
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <TileSkeleton key={index} creator={false} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[70dvh] flex-col border-t border-line lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:border-t-0 lg:border-l">
        <CommentsSkeleton rows={8} />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pt-4 pb-12 lg:px-6" aria-busy="true" aria-label="Loading creator">
      <div className="relative">
        <Bone className="h-32 sm:h-48 md:h-56" />
        <div className="absolute top-3 right-3 h-9 w-28 rounded-full bg-black/40" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative -mt-14 w-fit rounded-full border-4 border-background bg-background sm:-mt-16">
          <Bone className="size-24 rounded-full sm:size-32" />
        </div>
        <div className="min-w-0 flex-1 sm:pt-3">
          <Bone className="h-8 w-44 rounded-md" />
          <Bone className="mt-2 h-3.5 w-36 rounded-md" />
          <div className="mt-2 flex items-center gap-2">
            <Bone className="h-8 w-28 rounded-full" />
            <Bone className="h-8 w-32 rounded-full" />
          </div>
          <Bone className="mt-3 h-3.5 w-64 max-w-full rounded-md" />
        </div>
        <div className="flex gap-2 sm:pt-3">
          <Bone className="h-9 w-20 rounded-full" />
          <Bone className="h-9 w-28 rounded-full" />
        </div>
      </div>
      <div className="mt-6 flex gap-6 border-b border-line pb-3">
        <Bone className="h-4 w-14 rounded-md" />
        <Bone className="h-4 w-12 rounded-md" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <TileSkeleton key={index} wide creator={false} />
        ))}
      </div>
    </main>
  );
}

export function CreateSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[980px] px-3 py-4 sm:px-4 sm:py-6" aria-busy="true" aria-label="Loading upload">
      <div className="overflow-hidden rounded-lg border border-line bg-card">
        <div className="border-b border-line px-6 py-4">
          <Bone className="h-5 w-36 rounded-md" />
        </div>
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
          <Bone className="size-24 rounded-full" />
          <Bone className="h-4 w-64 rounded-md" />
          <Bone className="h-3 w-48 rounded-md" />
          <Bone className="mt-2 h-9 w-32 rounded-sm" />
        </div>
      </div>
    </main>
  );
}

export function PageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12" aria-busy="true" aria-label="Loading page">
      <Bone className="h-8 w-48 rounded-md" />
      <Bone className="mt-6 h-4 w-full rounded-md" />
      <Bone className="mt-3 h-4 w-5/6 rounded-md" />
      <Bone className="mt-3 h-4 w-2/3 rounded-md" />
    </main>
  );
}

export function LeaderboardSkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-12 sm:px-6 sm:pt-12" aria-busy="true" aria-label="Loading leaderboard">
      <Bone className="h-9 w-52 rounded-md" />
      <Bone className="mt-3 h-4 w-44 rounded-md" />
      <div className="mt-7 grid grid-cols-3 overflow-hidden rounded-2xl border border-line bg-card">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className={`px-3 py-4 sm:px-5 sm:py-5 ${index ? "border-l border-line" : ""}`}>
            <Bone className="h-3 w-12 rounded-md" />
            <Bone className="mt-2.5 h-6 w-20 max-w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Bone className="h-3.5 w-32 rounded-md" />
        <Bone className="h-9 w-28 rounded-full" />
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center gap-4 border-b border-line px-5 py-3.5">
          <Bone className="h-3 w-8 rounded-md" />
          <Bone className="h-3 w-14 rounded-md" />
          <Bone className="ml-auto h-3 w-12 rounded-md" />
          <Bone className="h-3 w-12 rounded-md" />
        </div>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-b-0">
            <Bone className="size-7 shrink-0 rounded-full" />
            <Bone className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Bone className="h-3.5 w-32 max-w-full rounded-md" />
              <Bone className="mt-2 h-3 w-20 rounded-md" />
            </div>
            <Bone className="h-3.5 w-16 rounded-md" />
            <Bone className="hidden h-3.5 w-12 rounded-md sm:block" />
          </div>
        ))}
      </div>
    </main>
  );
}

export function StorySkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14" aria-busy="true" aria-label="Loading how it works">
      <Bone className="h-3 w-28 rounded-md" />
      <Bone className="mt-4 h-10 w-3/4 rounded-md" />
      <Bone className="mt-4 h-4 w-2/3 rounded-md" />
      <div className="mt-12 space-y-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex gap-4">
            <Bone className="size-12 shrink-0 rounded-full" />
            <Bone className="h-32 flex-1 rounded-3xl" />
          </div>
        ))}
      </div>
    </main>
  );
}

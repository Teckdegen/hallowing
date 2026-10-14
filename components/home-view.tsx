"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CommentThread } from "@/components/comment-thread";
import { ReelFeed } from "@/components/reel-feed";
import { HomeSkeleton } from "@/components/skeletons";
import { unseenFirst } from "@/lib/seen";
import { fetchFeed, type Video } from "@/lib/videos";

export function HomeView() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFeed(60).then((loaded) => {
      if (cancelled) return;
      const next = unseenFirst(loaded);
      setVideos(next);
      setActive(next[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!videos) return <HomeSkeleton />;
  if (!active) return <EmptyFeed />;

  return (
    <div className="relative h-[calc(100dvh-3.5rem-var(--mobile-nav))] min-h-0 xl:grid xl:grid-cols-[minmax(0,1fr)_300px]">
      <ReelFeed videos={videos} onActive={(video) => setActive((current) => (current?.id === video.id ? current : video))} />
      <aside className="hidden min-h-0 flex-col border-l border-line xl:flex">
        <h2 className="shrink-0 px-4 pt-4 pb-2 text-sm font-semibold">Comments</h2>
        <CommentThread key={active.id} videoKey={active.id} closed={active.comments === "Off"} />
      </aside>
    </div>
  );
}

function EmptyFeed() {
  return (
    <main className="grid h-[calc(100dvh-3.5rem-var(--mobile-nav))] place-items-center px-6 text-center">
      <div className="max-w-sm">
        <img src="/ghost.png" alt="" width={96} height={96} className="mx-auto size-24 object-contain" />
        <h1 className="mt-4 text-xl font-semibold">The feed is waiting for its first scare</h1>
        <p className="mt-2 text-sm text-muted">Post a video and it shows up here for everyone.</p>
        <Link href="/create" className="mt-5 inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08] hover:brightness-110">
          Upload a video
        </Link>
      </div>
    </main>
  );
}

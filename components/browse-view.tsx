"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { BrowseSkeleton } from "@/components/skeletons";
import { VideoTile } from "@/components/video-tile";
import { fetchCreators, searchVideos, type CreatorSummary, type Video } from "@/lib/videos";

type Results = { query: string; videos: Video[]; creators: CreatorSummary[] };

export function BrowseView() {
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const [results, setResults] = useState<Results | null>(null);
  const [picked, setPicked] = useState<{ query: string; tag: string | null }>({ query: "", tag: null });
  const tag = picked.query === query ? picked.tag : null;
  const setTag = (next: string | null) => setPicked({ query, tag: next });

  useEffect(() => {
    let cancelled = false;
    Promise.all([searchVideos(query), fetchCreators(query)]).then(([videos, creators]) => {
      if (!cancelled) setResults({ query, videos, creators });
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (!results || results.query !== query) return <BrowseSkeleton />;

  const tagCounts = new Map<string, number>();
  for (const video of results.videos) for (const item of video.hashtags) tagCounts.set(item, (tagCounts.get(item) ?? 0) + 1);
  const tabs = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([item]) => item);
  const videos = tag ? results.videos.filter((video) => video.hashtags.includes(tag)) : results.videos;
  const people = results.creators;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {query ? (
          <>
            Results for <span className="text-accent">{query}</span>
          </>
        ) : (
          "Explore"
        )}
      </h1>

      {tabs.length > 0 ? (
        <div className="reel-scroll -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Hashtags">
          <Pill active={tag === null} onClick={() => setTag(null)}>
            All
          </Pill>
          {tabs.map((item) => (
            <Pill key={item} active={tag === item} onClick={() => setTag(item)}>
              #{item}
            </Pill>
          ))}
        </div>
      ) : null}

      {people.length > 0 ? (
        <section id="creators" className="mt-8 scroll-mt-20" aria-labelledby="creators-title">
          <h2 id="creators-title" className="text-base font-semibold">
            Creators
          </h2>
          <ul className="reel-scroll -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
            {people.map((creator) => (
              <li key={creator.username} className="shrink-0">
                <Link
                  href={`/creators/${creator.username}`}
                  className="flex w-36 flex-col items-center rounded-2xl border border-line bg-card px-3 pt-5 pb-4 text-center transition-colors hover:border-foreground/20 sm:w-40"
                >
                  <Avatar src={creator.avatar} className="size-16" />
                  <span className="mt-3 w-full truncate text-sm font-semibold">{creator.name}</span>
                  <span className="w-full truncate text-xs text-muted">@{creator.username}</span>
                  <span className="mt-2 text-xs text-muted tabular-nums">
                    <span className="font-semibold text-foreground">{creator.videos}</span> {creator.videos === 1 ? "video" : "videos"}
                  </span>
                  <span className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-full bg-accent text-xs font-semibold text-[#1a0c08]">
                    View
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="videos-title">
        <h2 id="videos-title" className="text-base font-semibold">
          Videos
        </h2>
        {videos.length === 0 ? (
          <div className="mt-3 flex flex-col items-center rounded-2xl border border-line bg-card px-6 py-14 text-center">
            <img src="/ghost.png" alt="" width={256} height={256} className="ghost-idle h-auto w-14" />
            <p className="mt-4 font-semibold">{query ? "No videos match that search" : "No videos yet"}</p>
            <Link href={query ? "/browse" : "/create"} className="mt-3 text-sm text-accent">
              {query ? "Show everything" : "Upload the first one"}
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {videos.map((video) => (
              <li key={video.id}>
                <VideoTile video={video} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`h-8 shrink-0 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
        active ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground/80 hover:bg-foreground/10"
      }`}
    >
      {children}
    </button>
  );
}

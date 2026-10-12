"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StreamCard } from "@/components/stream-card";
import { creators, getCreator, liveFor, streams } from "@/lib/data";
import { formatFollowers, formatNumber } from "@/lib/format";

export function BrowseView() {
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const needle = query.toLowerCase();

  const filtered = streams.filter((stream) => {
    if (!needle) return true;
    const creator = getCreator(stream.handle);
    const haystack = [stream.title, stream.category, stream.handle, creator?.name ?? "", ...stream.tags]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  const filteredCreators = creators.filter((creator) => {
    if (!needle) return true;
    return `${creator.name} ${creator.tagline} ${creator.handle}`.toLowerCase().includes(needle);
  });

  const narrowed = Boolean(query);

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
      {query ? (
        <p className="mb-6 text-sm text-muted">
          Results for <span className="text-foreground">“{query}”</span>
        </p>
      ) : null}

      {narrowed ? (
        <section>
          <h2 className="text-[11px] font-semibold tracking-[0.18em] text-muted">MATCHES</h2>
          {filtered.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nothing matches.{" "}
              <Link href="/browse" className="text-accent">
                Clear
              </Link>
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">
              {filtered.map((stream) => (
                <StreamCard key={stream.slug} stream={stream} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <Trending />
          <section className="mt-10">
            <h2 className="text-[11px] font-semibold tracking-[0.18em] text-muted">LIVE NOW</h2>
            <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">
              {liveRest().map((stream) => (
                <StreamCard key={stream.slug} stream={stream} />
              ))}
            </div>
          </section>
        </>
      )}

      <section id="creators" className="mt-12 border-t border-line pt-8">
        <h2 className="text-[11px] font-semibold tracking-[0.18em] text-muted">CREATORS</h2>
        {filteredCreators.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No creators match that.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {filteredCreators.map((creator) => {
              const live = liveFor(creator.handle);
              return (
                <li key={creator.handle} className="flex items-center gap-4 py-3">
                  <Link href={`/creators/${creator.handle}`} className="min-w-0 flex-1">
                    <span className="block truncate text-sm">@{creator.name}</span>
                    <span className="block truncate text-xs text-muted">{creator.tagline}</span>
                  </Link>
                  <span className="hidden text-xs text-faint sm:inline tabular-nums">
                    {formatFollowers(creator.followers)} followers
                  </span>
                  {live ? (
                    <Link href={`/watch/${live.slug}`} className="text-[11px] font-semibold tracking-[0.12em] text-accent">
                      LIVE
                    </Link>
                  ) : (
                    <span className="text-[11px] text-faint">OFFLINE</span>
                  )}
                  <span className="w-20 text-right text-xs text-muted tabular-nums">
                    {formatNumber(creator.support)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function byViewers() {
  return streams.filter((stream) => stream.live).sort((a, b) => b.viewers - a.viewers);
}

function liveRest() {
  return byViewers().slice(3);
}

function Trending() {
  const top = byViewers().slice(0, 3);
  return (
    <section className="mt-10">
      <h2 className="text-[11px] font-semibold tracking-[0.18em] text-muted">TRENDING RIGHT NOW</h2>
      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-7 md:grid-cols-3">
        {top.map((stream) => (
          <StreamCard key={stream.slug} stream={stream} />
        ))}
      </div>
    </section>
  );
}

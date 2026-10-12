"use client";

import { useRef, useState } from "react";
import { Stage } from "@/components/stage";
import { StreamCard } from "@/components/stream-card";
import { streamsFor, type Creator, type Stream } from "@/lib/data";
import { formatCompact, formatFollowers, initials } from "@/lib/format";

const tabs = ["Home", "Live", "Videos"] as const;
type Tab = (typeof tabs)[number];

export function ProfileView({ creator }: { creator: Creator }) {
  const [tab, setTab] = useState<Tab>("Home");
  const [banner, setBanner] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const bannerInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const catalog = streamsFor(creator.handle);
  const live = catalog.find((stream) => stream.live);
  const videos = catalog.filter((stream) => !stream.live);

  function readFile(file: File | undefined, set: (value: string) => void) {
    if (!file) return;
    set(URL.createObjectURL(file));
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-[1100px] px-4 pt-4 lg:px-6">
        <div className="relative h-32 overflow-hidden rounded-3xl bg-[#101014] sm:h-44">
          {banner ? (
            <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Stage scene={creator.scene} className="absolute inset-0 h-full w-full" />
          )}
          <button
            type="button"
            onClick={() => bannerInput.current?.click()}
            className="absolute right-3 bottom-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium"
          >
            {banner ? "Change banner" : "Add banner"}
          </button>
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => readFile(event.target.files?.[0], setBanner)}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              className="relative -mt-12 grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-background bg-[#3b82f6] text-xl font-semibold text-white"
              aria-label={photo ? "Change profile photo" : "Add profile photo"}
            >
              {photo ? <img src={photo} alt="" className="h-full w-full rounded-full object-cover" /> : initials(creator.name)}
            </button>
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => readFile(event.target.files?.[0], setPhoto)}
            />
            <div className="pb-1">
              <h1 className="text-lg font-semibold leading-tight">{creator.name}</h1>
              <p className="text-sm text-muted">@{creator.handle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5 sm:pt-3">
            <Stat value={String(catalog.length)} label="Streams" />
            <Stat value={formatCompact(creator.support)} label="Support" />
            <Stat value={formatFollowers(creator.followers)} label="Followers" />
            <button
              type="button"
              onClick={() => setFollowing((value) => !value)}
              className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${
                following ? "bg-[#1a1a1a] text-muted" : "bg-foreground text-background"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <StreamsIcon />
          {catalog.length} {catalog.length === 1 ? "stream" : "streams"} so far
        </p>

        <div className="mt-6 flex gap-6 overflow-x-auto border-b border-line" role="tablist" aria-label="Channel">
          {tabs.map((item) => {
            const selected = tab === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item)}
                className={`-mb-px shrink-0 border-b-2 pb-3 text-[12px] font-medium tracking-[0.14em] uppercase whitespace-nowrap ${
                  selected ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="py-6" role="tabpanel">
          {tab === "Home" ? (
            <div className="space-y-8">
              <section>
                <h2 className="text-[11px] font-semibold tracking-[0.16em] text-muted">LIVE NOW</h2>
                {live ? (
                  <div className="mt-4 max-w-xl">
                    <StreamCard stream={live} />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">Not live right now.</p>
                )}
              </section>
              <VideoGrid videos={videos} />
            </div>
          ) : null}

          {tab === "Live" ? (
            live ? (
              <div className="max-w-xl">
                <StreamCard stream={live} />
              </div>
            ) : (
              <p className="text-sm text-muted">Not live right now.</p>
            )
          ) : null}

          {tab === "Videos" ? <VideoGrid videos={videos} heading={false} /> : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function VideoGrid({ videos, heading = true }: { videos: Stream[]; heading?: boolean }) {
  if (videos.length === 0) {
    return <p className="text-sm text-muted">No recordings yet. When a live stream ends, it lands here.</p>;
  }

  return (
    <section>
      {heading ? <h2 className="text-[11px] font-semibold tracking-[0.16em] text-muted">RECENT STREAMS</h2> : null}
      <div className={`${heading ? "mt-4" : ""} grid grid-cols-2 gap-4 lg:grid-cols-4`}>
        {videos.map((stream) => (
          <StreamCard key={stream.slug} stream={stream} />
        ))}
      </div>
    </section>
  );
}

function StreamsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="1.5" y="2.5" width="11" height="9" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 5.2v3.6L9.2 7 6 5.2z" fill="currentColor" />
    </svg>
  );
}

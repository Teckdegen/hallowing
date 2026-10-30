"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { CommentThread } from "@/components/comment-thread";
import { GiftSheet } from "@/components/gift-sheet";
import { WatchSkeleton } from "@/components/skeletons";
import { VideoTile } from "@/components/video-tile";
import { activeChain } from "@/lib/chain";
import { giftImage, giftLabel, gifts } from "@/lib/gifts";
import { fetchProfilesByWallets } from "@/lib/profiles";
import { markSeen } from "@/lib/seen";
import { fetchGiftEvents, type GiftEvent } from "@/lib/vault";
import { fetchCreatorVideos, fetchVideo, timeAgo, type Video } from "@/lib/videos";
import { notifyView, ViewCount } from "@/components/view-count";
import { recordView, viewerKey } from "@/lib/views";

export function WatchView({ id }: { id: string }) {
  const { user, ready } = useAuth();
  const [loaded, setLoaded] = useState<{ key: string; video: Video | null } | null>(null);
  const [more, setMore] = useState<Video[]>([]);
  const [giftOpen, setGiftOpen] = useState(false);
  const viewer = user?.id ?? null;
  const key = `${id}:${viewer}`;
  const video = loaded?.key === key ? loaded.video : undefined;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetchVideo(id, viewer).then(async (next) => {
      if (cancelled) return;
      setLoaded({ key: `${id}:${viewer}`, video: next });
      if (!next) return;
      markSeen(next.id);
      const others = await fetchCreatorVideos(next.creator.username, 9);
      if (!cancelled) setMore(others.filter((item) => item.id !== next.id).slice(0, 8));
    });
    return () => {
      cancelled = true;
    };
  }, [id, ready, viewer]);

  useEffect(() => {
    if (!video) return;
    const who = viewerKey(viewer);
    if (!who) return;
    void recordView(video.id, who).then((fresh) => {
      if (fresh) notifyView(video.id);
    });
  }, [video, viewer]);

  if (video === undefined) return <WatchSkeleton />;
  if (video === null) return <MissingVideo />;

  const { creator } = video;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0">
        <WatchPlayer video={video} />
        <div className="flex flex-col gap-5 px-4 py-5 lg:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{video.title}</h1>
              <Link href={`/creators/${creator.username}`} className="mt-3 flex w-fit max-w-full items-center gap-3">
                <Avatar src={creator.avatar} className="size-10" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{creator.name}</span>
                  <span className="block truncate text-xs text-muted">@{creator.username}</span>
                </span>
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setGiftOpen(true)}
              className="mt-1 h-9 shrink-0 rounded-full bg-accent px-4 text-sm font-semibold text-[#1a0c08] hover:brightness-110"
            >
              Send gift
            </button>
          </div>

          {video.hashtags.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {video.hashtags.map((tag) => (
                <Link
                  key={tag}
                  href={`/browse?q=${encodeURIComponent(`#${tag}`)}`}
                  className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-foreground"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}

          <section className="rounded-2xl bg-card px-4 py-4">
            <h2 className="text-xs font-semibold text-muted">
              Posted {timeAgo(video.createdAt)}
              <span className="px-1.5">·</span>
              <ViewCount videoKey={video.id} />
            </h2>
            {video.description ? <p className="mt-2 max-w-2xl text-sm leading-6 whitespace-pre-wrap">{video.description}</p> : null}
          </section>

          <GiftLog videoKey={video.id} />

          {more.length > 0 ? (
            <section className="mt-3">
              <h2 className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">More from @{creator.username}</h2>
              <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
                {more.map((item) => (
                  <li key={item.id}>
                    <VideoTile video={item} showCreator={false} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
      <aside className="flex h-[70dvh] flex-col border-t border-line lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:border-t-0 lg:border-l">
        <h2 className="shrink-0 px-4 pt-4 pb-2 text-sm font-semibold">Comments</h2>
        <CommentThread videoKey={video.id} closed={video.comments === "Off"} />
      </aside>
      {giftOpen ? (
        <GiftSheet creatorName={creator.name} creatorHandle={creator.username} videoKey={video.id} onClose={() => setGiftOpen(false)} />
      ) : null}
    </div>
  );
}

function WatchPlayer({ video }: { video: Video }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    void node.play().catch(() => {
      node.muted = true;
      void node.play().catch(() => undefined);
    });
    return () => node.pause();
  }, [video.src]);

  return (
    <div className="relative grid place-items-center bg-black">
      {video.src ? (
        <video
          key={video.src}
          ref={ref}
          src={video.src}
          aria-label={video.title}
          controls
          playsInline
          loop
          className="max-h-[calc(100dvh-7rem)] w-full"
        />
      ) : (
        <p className="py-24 text-sm text-white/70">This haunt is still processing.</p>
      )}
    </div>
  );
}

function GiftLog({ videoKey }: { videoKey: string }) {
  const [events, setEvents] = useState<GiftEvent[] | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetchGiftEvents({ videoKey })
      .then(async (next) => {
        if (cancelled) return;
        setEvents(next);
        const senders = Array.from(new Set(next.map((event) => event.sender)));
        const profiles = await fetchProfilesByWallets(senders);
        if (cancelled) return;
        setNames(new Map(profiles.flatMap((profile) => (profile.evm_wallet ? [[profile.evm_wallet.toLowerCase(), profile.username]] : []))));
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [videoKey]);

  if (!events?.length) return null;
  const explorer = activeChain().blockExplorers?.default.url;

  return (
    <section>
      <h2 className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">Gifts on this video</h2>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {events.slice(0, 20).map((event) => {
          const gift = gifts[event.giftId];
          const name = names.get(event.sender.toLowerCase());
          return (
            <li key={`${event.txHash}-${event.giftId}`} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              {gift ? <img src={giftImage(gift)} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" /> : null}
              <span className="min-w-0 flex-1 truncate">
                {name ? (
                  <Link href={`/creators/${name}`} className="font-semibold hover:text-accent">
                    @{name}
                  </Link>
                ) : (
                  <span className="font-semibold">{`${event.sender.slice(0, 6)}…${event.sender.slice(-4)}`}</span>
                )}{" "}
                <span className="text-muted">sent {gift ? giftLabel(gift, event.quantity) : "a gift"}</span>
              </span>
              {explorer && event.txHash ? (
                <a href={`${explorer}/tx/${event.txHash}`} target="_blank" rel="noreferrer" className="shrink-0 text-xs text-muted hover:text-foreground">
                  View
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MissingVideo() {
  return (
    <main className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div className="max-w-sm">
        <img src="/ghost.png" alt="" width={96} height={96} className="mx-auto size-24 object-contain" />
        <h1 className="mt-4 text-xl font-semibold">This video floated away</h1>
        <p className="mt-2 text-sm text-muted">It may be private or removed. Plenty more are waiting in Explore.</p>
        <Link href="/browse" className="mt-5 inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08] hover:brightness-110">
          Explore videos
        </Link>
      </div>
    </main>
  );
}

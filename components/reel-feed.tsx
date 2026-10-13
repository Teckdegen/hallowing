"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ReelActions } from "@/components/reel-actions";
import { ReelVideo } from "@/components/reel-video";
import { markSeen } from "@/lib/seen";
import { timeAgo, type Video } from "@/lib/videos";

export function ReelFeed({
  videos,
  onActive,
}: {
  videos: Video[];
  onActive: (video: Video) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onActiveRef = useRef(onActive);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    onActiveRef.current = onActive;
  }, [onActive]);

  const indexRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      const height = root.clientHeight || 1;
      const place = root.scrollTop / height;
      root.querySelectorAll<HTMLElement>("[data-reel-fade]").forEach((node) => {
        const slide = Number(node.dataset.reelFade);
        const distance = Math.abs(place - slide);
        node.style.opacity = String(Math.max(0.15, 1 - Math.min(distance, 1) * 0.85));
      });
      const next = Math.min(videos.length - 1, Math.max(0, Math.round(place)));
      if (next === indexRef.current) return;
      indexRef.current = next;
      setIndex(next);
      const video = videos[next];
      if (video) onActiveRef.current(video);
    };

    root.addEventListener("scroll", sync, { passive: true });
    sync();
    return () => root.removeEventListener("scroll", sync);
  }, [videos]);

  function scrollToIndex(next: number) {
    const root = rootRef.current;
    if (!root) return;
    const clamped = Math.max(0, Math.min(videos.length - 1, next));
    root.scrollTo({ top: clamped * root.clientHeight, behavior: "smooth" });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (document.querySelector("[data-comment-sheet], [data-support-sheet]")) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      scrollToIndex(index + (event.key === "ArrowDown" ? 1 : -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, videos.length]);

  return (
    <div ref={rootRef} className="reel-scroll h-full min-h-0 snap-y snap-mandatory overflow-y-auto" aria-label="Videos">
      {videos.map((video, itemIndex) => (
        <ReelSlide key={video.id} video={video} itemIndex={itemIndex} active={itemIndex === index} near={Math.abs(itemIndex - index) <= 1} />
      ))}
    </div>
  );
}

function ReelSlide({ video, itemIndex, active, near }: { video: Video; itemIndex: number; active: boolean; near: boolean }) {
  const [paused, setPaused] = useState(false);
  const { creator } = video;

  useEffect(() => {
    if (!active) setPaused(false);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => markSeen(video.id), 2000);
    return () => window.clearTimeout(timer);
  }, [active, video.id]);

  return (
    <section data-reel={itemIndex} className="relative h-full snap-start snap-always bg-black">
      <div data-reel-fade={String(itemIndex)} className="absolute inset-0">
        <div className="absolute inset-0">
          {near && video.src ? <ReelVideo src={video.src} title={video.title} active={active} paused={paused} /> : null}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/45" />
        <button
          type="button"
          data-playback-toggle
          aria-label={paused ? "Play" : "Pause"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setPaused((value) => !value);
          }}
          className="absolute inset-y-0 left-0 z-10 w-[calc(100%-4.5rem)] touch-pan-y"
        />
        {paused ? (
          <span className="pointer-events-none absolute top-1/2 left-1/2 z-10 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white">
            <PauseIcon />
          </span>
        ) : null}
        <div className="absolute inset-x-3 bottom-4 z-20 max-w-[calc(100%-5.5rem)] sm:inset-x-5 sm:bottom-6">
          <Link href={`/creators/${creator.username}`} className="truncate text-sm font-semibold">
            @{creator.username}
          </Link>
          <p className="line-clamp-2 text-sm text-white/85">{video.title}</p>
          {video.hashtags.length ? (
            <p className="mt-1 truncate text-xs text-white/60">
              {video.hashtags.slice(0, 4).map((tag) => (
                <Link key={tag} href={`/browse?q=${encodeURIComponent(`#${tag}`)}`} className="mr-2 hover:text-white">
                  #{tag}
                </Link>
              ))}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-white/50">{timeAgo(video.createdAt)}</p>
          <Link
            href={`/watch/${video.id}`}
            className="mt-3 inline-flex rounded-full bg-accent px-3 py-2 text-xs font-semibold text-[#1a0c08] hover:brightness-110 sm:text-sm"
          >
            Watch
          </Link>
        </div>
        <ReelActions
          videoKey={video.id}
          title={video.title}
          creatorName={creator.name}
          creatorHandle={creator.username}
          creatorAvatar={creator.avatar}
          commentsOff={video.comments === "Off"}
        />
      </div>
    </section>
  );
}

function PauseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M7 5h3.2v14H7V5zm6.8 0H17v14h-3.2V5z" />
    </svg>
  );
}

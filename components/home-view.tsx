"use client";

import Link from "next/link";
import { useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { Stage } from "@/components/stage";
import { Avatar, StreamCard } from "@/components/stream-card";
import { getCreator, liveStreams, type Stream } from "@/lib/data";
import { formatCompact } from "@/lib/format";

export function HomeView() {
  const live = [...liveStreams()].sort((a, b) => b.viewers - a.viewers);
  const featured = live.slice(0, 5);
  const [index, setIndex] = useState(0);
  const current = featured[index] ?? live[0];
  if (!current) return null;

  function step(direction: number) {
    setIndex((value) => (value + direction + featured.length) % featured.length);
  }

  return (
    <div className="min-w-0 xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
      <Featured stream={current} count={featured.length} index={index} onStep={step} onPick={setIndex} />
      <aside className="hidden xl:sticky xl:top-14 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:block xl:h-[calc(100dvh-3.5rem)] xl:self-start">
        <ChatPanel live viewers={current.viewers} label="Chat" fill />
      </aside>
      <MobileChat viewers={current.viewers} />
      <div className="min-w-0 px-3 py-4 sm:px-5 xl:col-start-1">
        <section>
          <h2 className="text-base font-semibold sm:text-lg">Live channels</h2>
          <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-6 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {live.map((stream) => (
              <StreamCard key={stream.slug} stream={stream} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Featured({
  stream,
  count,
  index,
  onStep,
  onPick,
}: {
  stream: Stream;
  count: number;
  index: number;
  onStep: (direction: number) => void;
  onPick: (index: number) => void;
}) {
  const creator = getCreator(stream.handle);
  if (!creator) return null;

  return (
    <section className="relative bg-black">
      <Stage scene={stream.scene} className="aspect-video w-full" />
      <Link
        href={`/watch/${stream.slug}`}
        aria-label={`Watch ${stream.title}`}
        className="absolute inset-0 z-0"
      />
      <span className="absolute top-3 left-3 z-10 bg-accent px-1.5 py-0.5 text-xs font-bold text-[#1a0c08] tabular-nums">
        {formatCompact(stream.viewers)}
      </span>
      <button
        type="button"
        aria-label="Previous stream"
        onClick={() => onStep(-1)}
        className="absolute top-1/2 left-2 z-10 grid size-8 -translate-y-1/2 place-items-center bg-black/75 text-white"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next stream"
        onClick={() => onStep(1)}
        className="absolute top-1/2 right-2 z-10 grid size-8 -translate-y-1/2 place-items-center bg-black/75 text-white"
      >
        ›
      </button>
      <div className="absolute inset-x-2 bottom-2 z-10 flex items-center gap-2 rounded-3xl bg-[#111]/95 px-2 py-2 sm:inset-x-4 sm:bottom-4 sm:gap-3 sm:px-3">
        <Avatar name={creator.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{creator.name}</p>
          <p className="truncate text-xs text-white/75">
            <span className="font-semibold text-accent">LIVE</span> {stream.title}
          </p>
          <div className="mt-1.5 flex gap-1">
            {Array.from({ length: count }, (_, dot) => (
              <button
                key={dot}
                type="button"
                aria-label={`Show stream ${dot + 1}`}
                onClick={() => onPick(dot)}
                className={`h-1 w-4 ${dot === index ? "bg-accent" : "bg-white/30"}`}
              />
            ))}
          </div>
        </div>
        <span className="hidden text-xs text-white/45 lg:block">English</span>
        <Link
          href={`/watch/${stream.slug}`}
          className="shrink-0 rounded-full bg-accent px-3 py-2 text-xs font-semibold text-[#1a0c08] hover:brightness-110 sm:px-4 sm:text-sm"
        >
          Watch now
        </Link>
      </div>
    </section>
  );
}

function MobileChat({ viewers }: { viewers: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="xl:hidden">
      {open ? (
        <div className="fixed inset-x-3 bottom-24 z-40 flex h-[min(70dvh,520px)] flex-col overflow-hidden rounded-3xl border border-line bg-background shadow-2xl">
          <ChatPanel live viewers={viewers} label="Chat" fill />
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Open chat"}
        className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full transition duration-200 active:scale-95 ${
          open
            ? "border border-white/10 bg-[#161616]/90 text-foreground shadow-2xl backdrop-blur-md"
            : "bg-accent text-[#1a0c08] shadow-[0_12px_32px_rgba(232,120,58,0.45)]"
        }`}
      >
        {open ? null : (
          <span className="live-dot absolute top-1.5 right-1.5 size-2.5 rounded-full bg-white ring-2 ring-accent" />
        )}
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3.2c-4.9 0-8.8 3.3-8.8 7.3 0 2.3 1.3 4.4 3.3 5.7-.2.9-.6 2.2-1.8 3.3 2-.2 3.6-1 4.6-1.8.8.2 1.7.3 2.7.3 4.9 0 8.8-3.3 8.8-7.3S16.9 3.2 12 3.2z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M4.2 4.2 13.8 13.8M13.8 4.2 4.2 13.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}


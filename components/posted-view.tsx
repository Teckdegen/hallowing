"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Eyebrow } from "@/components/haunt";
import { VideoThumb } from "@/components/reel-video";
import { fetchVideo, type Video } from "@/lib/videos";

const copyByVisibility: Record<string, { eyebrow: string; title: string; body: string }> = {
  Everyone: {
    eyebrow: "Posted",
    title: "Your video is live",
    body: "It's on your channel and in the feed now. Share the link to get the first scares in.",
  },
  Friends: {
    eyebrow: "Unlisted",
    title: "Your video is ready to share",
    body: "It stays out of the feed and search. Anyone with the link can watch.",
  },
  "Only you": {
    eyebrow: "Private",
    title: "Saved to your channel",
    body: "Only you can watch it. Change who can watch anytime from your channel.",
  },
};

const audienceLabel: Record<string, string> = { Everyone: "Public", Friends: "Unlisted", "Only you": "Private" };

export function PostedView() {
  const params = useSearchParams();
  const id = params.get("v") ?? "";
  const { user, ready } = useAuth();
  const viewer = user?.id ?? null;
  const key = `${id}:${viewer}`;
  const [loaded, setLoaded] = useState<{ key: string; video: Video | null } | null>(null);
  const video = loaded?.key === key ? loaded.video : undefined;

  useEffect(() => {
    if (!ready || !id) return;
    let cancelled = false;
    fetchVideo(id, viewer).then((next) => {
      if (!cancelled) setLoaded({ key: `${id}:${viewer}`, video: next });
    });
    return () => {
      cancelled = true;
    };
  }, [id, ready, viewer]);

  if (!id || video === null) return <PostedFallback />;

  const copy = copyByVisibility[video?.watch ?? "Everyone"] ?? copyByVisibility.Everyone;
  const shareable = video?.watch !== "Only you";

  return (
    <div className="flex w-full flex-col items-center text-center">
      <div className="relative aspect-[9/16] w-40 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] sm:w-48">
        {video ? (
          <Link href={`/watch/${video.id}`} aria-label="View video" className="block h-full w-full">
            <VideoThumb src={video.src} poster={video.poster} title={video.title} className="h-full w-full object-cover" />
          </Link>
        ) : (
          <div className="skeleton h-full w-full" />
        )}
        <span className="absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-accent text-[#1a0c08]">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
            <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <div className="mt-6">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{copy.body}</p>
      {video ? (
        <p className="mt-2 text-xs text-muted">
          Posted to <span className="text-foreground">@{video.creator.username}</span> · {audienceLabel[video.watch] ?? "Public"}
        </p>
      ) : null}

      <div className="mt-7 flex w-full max-w-sm flex-col gap-2">
        {video ? (
          <Link
            href={`/watch/${video.id}`}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08]"
          >
            View video
          </Link>
        ) : (
          <span className="skeleton h-11 rounded-full" />
        )}
        {video && shareable ? <ShareRow video={video} /> : null}
        <Link href="/create" className="mt-1 text-sm text-muted transition hover:text-foreground">
          Upload another
        </Link>
      </div>
    </div>
  );
}

function ShareRow({ video }: { video: Video }) {
  const [copied, setCopied] = useState(false);
  const link = () => `${window.location.origin}/watch/${video.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, url: link() });
      } catch {}
      return;
    }
    copy();
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-card px-4 text-sm"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" strokeLinecap="round" />
        </svg>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={share}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-card px-4 text-sm"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Share
      </button>
    </div>
  );
}

function PostedFallback() {
  const { user } = useAuth();
  const channel = user?.username ? `/creators/${user.username}` : "/";
  return (
    <div className="flex flex-col items-center text-center">
      <img src="/ghost.png" alt="" width={256} height={256} className="ghost-idle h-auto w-24" />
      <div className="mt-6">
        <Eyebrow>Posted</Eyebrow>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your video is posted</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Find it on your channel anytime.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href={channel} className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08]">
          Go to your channel
        </Link>
        <Link href="/create" className="inline-flex h-11 items-center rounded-full border border-line bg-card px-5 text-sm">
          Upload another
        </Link>
      </div>
    </div>
  );
}

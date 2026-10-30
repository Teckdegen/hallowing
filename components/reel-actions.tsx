"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { CommentThread } from "@/components/comment-thread";
import { GiftSheet } from "@/components/gift-sheet";
import { fetchVideoStats, setVideoLike } from "@/lib/comments";
import { formatCompact } from "@/lib/format";

export function ReelActions({
  videoKey,
  title,
  creatorName,
  creatorHandle,
  creatorAvatar = null,
  commentsOff = false,
}: {
  videoKey: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar?: string | null;
  commentsOff?: boolean;
}) {
  const { user, login } = useAuth();
  const [open, setOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [likeNote, setLikeNote] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setOpen(false);
    setGiftOpen(false);
  }, [videoKey]);

  useEffect(() => {
    let cancelled = false;
    fetchVideoStats(videoKey, user?.id ?? null).then((stats) => {
      if (cancelled) return;
      setLikes(stats.likes);
      setLiked(stats.liked);
      setCommentCount(stats.comments);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, videoKey]);

  async function toggleLike() {
    if (!user) {
      login();
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikes((count) => Math.max(0, count + (next ? 1 : -1)));
    setLikeNote(null);
    const error = await setVideoLike(videoKey, user.id, next);
    if (error) {
      setLiked(!next);
      setLikes((count) => Math.max(0, count + (next ? -1 : 1)));
      setLikeNote(error);
    }
  }

  async function share() {
    const url = `${window.location.origin}/watch/${videoKey}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 1600);
    } catch {
      setShared(false);
    }
  }

  return (
    <>
      <div data-reel-rail data-video={videoKey} className="absolute top-1/2 right-[max(0.75rem,env(safe-area-inset-right))] z-20 flex -translate-y-1/2 flex-col items-center gap-3 text-white sm:right-[max(1.25rem,env(safe-area-inset-right))] sm:gap-4">
        <Link
          href={`/creators/${creatorHandle}`}
          aria-label={creatorName}
          className="block rounded-full border-2 border-white shadow-lg"
        >
          <Avatar src={creatorAvatar} className="size-11" />
        </Link>
        <RailButton label={formatCompact(likes)} name={liked ? "Unlike" : "Like"} pressed={liked} onClick={() => void toggleLike()} icon={<HeartIcon filled={liked} />} />
        <RailButton label={formatCompact(commentCount)} name="Comments" pressed={open} onClick={() => setOpen(true)} icon={<CommentIcon />} />
        <RailButton label="Gift" name="Send a gift" pressed={giftOpen} onClick={() => setGiftOpen(true)} icon={<GiftIcon />} />
        <RailButton label={shared ? "Copied" : "Share"} name="Share" onClick={() => void share()} icon={<ShareIcon />} />
        {likeNote ? <p className="absolute right-16 bottom-2 w-44 text-right text-xs leading-4 text-accent">{likeNote}</p> : null}
      </div>
      {open ? (
        <CommentSheet
          videoKey={videoKey}
          count={commentCount}
          closed={commentsOff}
          onCount={setCommentCount}
          onClose={() => setOpen(false)}
        />
      ) : null}
      {giftOpen ? (
        <GiftSheet creatorName={creatorName} creatorHandle={creatorHandle} videoKey={videoKey} onClose={() => setGiftOpen(false)} />
      ) : null}
    </>
  );
}

function RailButton({
  label,
  name,
  icon,
  pressed,
  onClick,
}: {
  label: string;
  name: string;
  icon: ReactNode;
  pressed?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={name} aria-pressed={pressed} className="flex flex-col items-center gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
      <span className="grid size-10 place-items-center">{icon}</span>
      <span className="text-[11px] font-semibold tabular-nums">{label}</span>
    </button>
  );
}

function CommentSheet({
  videoKey,
  count,
  closed,
  onCount,
  onClose,
}: {
  videoKey: string;
  count: number;
  closed: boolean;
  onCount: (count: number) => void;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close comments" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 lg:inset-0 lg:grid lg:place-items-center lg:p-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-comment-sheet
          className="comment-sheet pointer-events-auto flex h-[72dvh] w-full flex-col rounded-t-3xl border border-line bg-card shadow-2xl lg:h-[min(640px,80dvh)] lg:max-w-md lg:rounded-3xl"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/20 lg:hidden" />
          <header className="flex items-center justify-between px-4 py-3">
            <h2 id={titleId} className="text-sm font-semibold">
              Comments <span className="text-muted tabular-nums">{count}</span>
            </h2>
            <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-foreground/5" aria-label="Close">
              <CloseIcon />
            </button>
          </header>
          <CommentThread videoKey={videoKey} closed={closed} onCount={onCount} />
        </section>
      </div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden className={filled ? "text-accent" : "text-white"}>
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 4.2c-4.8 0-8.6 3.1-8.6 7 0 2.2 1.3 4.1 3.3 5.4-.1.7-.5 1.9-1.5 2.8 1.6-.1 2.9-.8 3.7-1.5.9.3 2 .4 3.1.4 4.8 0 8.6-3.1 8.6-7s-3.8-7-8.6-7z"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M8.6 3.6c1.4 0 2.6 1 3.4 2.4.8-1.4 2-2.4 3.4-2.4a2.6 2.6 0 0 1 2.2 4H20a1 1 0 0 1 1 1v2.6a1 1 0 0 1-1 1h-7.1V7.6h-1.8v4.6H4a1 1 0 0 1-1-1V8.6a1 1 0 0 1 1-1h2.4a2.6 2.6 0 0 1 2.2-4zm0 1.8a.8.8 0 0 0 0 1.6h2.2c-.6-1-1.4-1.6-2.2-1.6zm6.8 0c-.8 0-1.6.6-2.2 1.6h2.2a.8.8 0 0 0 0-1.6zM4.8 13.8h6.3v6.6H6a1.2 1.2 0 0 1-1.2-1.2v-5.4zm8.1 0h6.3v5.4a1.2 1.2 0 0 1-1.2 1.2h-5.1v-6.6z"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M13 5.2 19.8 12 13 18.8V14.6c-4.2 0-7.1 1.3-9.2 4.2.6-4.2 2.8-8.2 9.2-9.2V5.2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path d="M4.2 4.2 13.8 13.8M13.8 4.2 4.2 13.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

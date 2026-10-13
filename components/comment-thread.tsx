"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { ActionButton } from "@/components/action-button";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { fetchComments, postComment, type VideoComment } from "@/lib/comments";

export function CommentThread({
  videoKey,
  closed = false,
  onCount,
}: {
  videoKey: string;
  closed?: boolean;
  onCount?: (count: number) => void;
}) {
  const { user, login } = useAuth();
  const inputId = useId();
  const [loaded, setLoaded] = useState<{ key: string; comments: VideoComment[] } | null>(null);
  const comments = loaded?.key === videoKey ? loaded.comments : null;
  const setComments = (next: VideoComment[]) => setLoaded({ key: videoKey, comments: next });
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchComments(videoKey).then((result) => {
      if (cancelled) return;
      setLoaded({ key: videoKey, comments: result.comments });
      setError(result.error);
      if (!result.error) onCount?.(result.comments.length);
    });
    return () => {
      cancelled = true;
    };
  }, [onCount, videoKey]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      login();
      return;
    }
    if (!user.username) return;
    setPending(true);
    setError(null);
    const failure = await postComment({ videoKey, privyId: user.id, username: user.username, body });
    if (failure) {
      setError(failure);
      setPending(false);
      return;
    }
    const result = await fetchComments(videoKey);
    setComments(result.comments);
    setError(result.error);
    if (!result.error) onCount?.(result.comments.length);
    setBody("");
    setPending(false);
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {comments === null ? <p className="py-6 text-sm text-muted">Loading comments</p> : null}
        {comments?.length === 0 && !error ? <p className="py-6 text-sm text-muted">Be the first to comment.</p> : null}
        <ul className="flex flex-col gap-4 pb-4">
          {comments?.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar src={null} seed={comment.username} alt="" className="size-9 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm">
                  <Link href={`/creators/${comment.username}`} className="font-semibold hover:text-accent">
                    @{comment.username}
                  </Link>
                  <span className="ml-2 text-xs text-faint">{ago(comment.created_at)}</span>
                </p>
                <p className="mt-0.5 text-sm leading-5 break-words whitespace-pre-wrap">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {closed ? (
        <p className="shrink-0 border-t border-line px-4 py-3 text-sm text-muted">The creator turned comments off for this video.</p>
      ) : (
        <form onSubmit={(event) => void onSubmit(event)} className="shrink-0 border-t border-line px-4 py-3">
          {error ? (
            <p className="mb-2 text-sm text-accent" role="alert">
              {error}
            </p>
          ) : null}
          <label htmlFor={inputId} className="sr-only">
            Add a comment
          </label>
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              value={body}
              maxLength={500}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add a comment"
              className="h-10 min-w-0 flex-1 rounded-full border border-line bg-background px-4 text-sm outline-none"
            />
            <ActionButton
              type="submit"
              pending={pending}
              idle="Post"
              busy="Posting"
              className="h-10 rounded-full bg-accent px-4 text-sm font-semibold text-[#1a0c08]"
            />
          </div>
        </form>
      )}
    </>
  );
}

function ago(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

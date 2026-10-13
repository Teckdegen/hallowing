"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useAuth } from "@/components/auth-provider";
import { LiveBadge } from "@/components/live-badge";
import { useStreamSource } from "@/components/reel-video";
import { endStream, fetchStudio, startStream, type StudioState } from "@/lib/live";
import { streamUrl } from "@/lib/videos";

type Loaded = { state: StudioState } | { error: string; status: number };
type Ended = { id: string; recorded: boolean } | "cancelled";

export function LiveStudio() {
  const { user, ready, login, getToken } = useAuth();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [ended, setEnded] = useState<Ended | null>(null);
  const viewer = user?.id ?? null;
  const session = loaded && "state" in loaded ? loaded.state.session : null;
  const waiting = session?.status === "waiting" || session?.status === "active";

  useEffect(() => {
    if (!ready || !viewer) return;
    let cancelled = false;
    const load = () =>
      getToken()
        .then(fetchStudio)
        .then((result) => {
          if (cancelled) return;
          setLoaded(result.ok ? { state: result.data } : { error: result.error, status: result.status });
        });
    void load();
    if (!waiting) return () => {
      cancelled = true;
    };
    const timer = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [getToken, ready, viewer, waiting]);

  if (!ready) return <StudioFrame><p className="text-sm text-muted">Loading your studio</p></StudioFrame>;

  if (!user) {
    return (
      <StudioFrame>
        <h1 className="text-2xl font-semibold tracking-tight">Go live on Hallowing</h1>
        <p className="mt-2 text-sm text-muted">Log in to start a stream. Your fans can watch, comment, and send gifts while you&apos;re on air.</p>
        <button type="button" onClick={login} className="mt-5 h-10 rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08]">
          Log in
        </button>
      </StudioFrame>
    );
  }

  if (ended) {
    return (
      <StudioFrame>
        <h1 className="text-2xl font-semibold tracking-tight">{ended === "cancelled" ? "Stream cancelled" : "Your stream has ended"}</h1>
        <p className="mt-2 text-sm text-muted">
          {ended === "cancelled"
            ? "Nothing went out, so nothing was posted."
            : ended.recorded
              ? "The replay is on your channel and in the feed."
              : "The replay is processing and shows up on your channel in a minute."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {ended !== "cancelled" ? (
            <Link href={`/watch/${ended.id}`} className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08]">
              View replay
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setEnded(null);
              setLoaded({ state: { session: null } });
            }}
            className="h-10 rounded-full border border-line bg-card px-5 text-sm"
          >
            Start another stream
          </button>
        </div>
      </StudioFrame>
    );
  }

  if (!loaded) return <StudioFrame><p className="text-sm text-muted">Loading your studio</p></StudioFrame>;

  if ("error" in loaded) {
    return (
      <StudioFrame>
        <h1 className="text-2xl font-semibold tracking-tight">{loaded.status === 503 ? "Live streaming is almost ready" : "Your studio did not load"}</h1>
        <p className="mt-2 text-sm text-muted">{loaded.error}</p>
      </StudioFrame>
    );
  }

  const state = loaded.state;
  if (!state.session || !state.ingest) {
    return (
      <StudioFrame>
        <StartForm
          onStarted={(next) => setLoaded({ state: next })}
          start={async (input) => startStream(await getToken(), input)}
        />
      </StudioFrame>
    );
  }

  return (
    <StudioFrame wide>
      <OnAir
        state={{ session: state.session, ingest: state.ingest }}
        onEnd={async () => {
          const result = await endStream(await getToken());
          if (!result.ok) return result.error;
          setEnded(result.data.ended ?? "cancelled");
          return null;
        }}
      />
    </StudioFrame>
  );
}

function StudioFrame({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <main className={`mx-auto w-full px-4 py-10 sm:px-6 ${wide ? "max-w-5xl" : "max-w-xl"}`}>{children}</main>;
}

function StartForm({
  start,
  onStarted,
}: {
  start: (input: { title: string; hashtags: string[] }) => ReturnType<typeof startStream>;
  onStarted: (state: StudioState) => void;
}) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        if (!title.trim()) {
          setError("Give your stream a title.");
          return;
        }
        setPending(true);
        setError(null);
        const hashtags = tags.split(/[\s,]+/).map((tag) => tag.replace(/^#/, "")).filter(Boolean);
        void start({ title, hashtags }).then((result) => {
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          onStarted(result.data);
        });
      }}
    >
      <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[#e5322d] uppercase">
        <span className="size-2 rounded-full bg-[#e5322d]" aria-hidden />
        Go live
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Start a stream</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Name your stream and we&apos;ll give you a server and stream key. Paste them into OBS or a phone streaming app and you&apos;re on air. The replay stays on your channel after you end.
      </p>

      <label className="mt-6 block text-sm font-medium">
        Title
        <input
          value={title}
          maxLength={100}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Midnight graveyard pranks"
          aria-invalid={error === "Give your stream a title." || undefined}
          className="mt-1 h-11 w-full rounded-lg border border-line bg-background px-3 text-sm font-normal outline-none placeholder:text-faint"
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Hashtags <span className="font-normal text-muted">(optional)</span>
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="#prank #haunted"
          className="mt-1 h-11 w-full rounded-lg border border-line bg-background px-3 text-sm font-normal outline-none placeholder:text-faint"
        />
      </label>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-accent">
          {error}
        </p>
      ) : null}
      <ActionButton
        type="submit"
        pending={pending}
        idle="Go live"
        busy="Setting up your stream"
        className="mt-6 h-11 w-full rounded-full bg-[#e5322d] text-sm font-semibold text-white hover:brightness-110"
      />
    </form>
  );
}

function OnAir({
  state,
  onEnd,
}: {
  state: { session: NonNullable<StudioState["session"]>; ingest: NonNullable<StudioState["ingest"]> };
  onEnd: () => Promise<string | null>;
}) {
  const { session, ingest } = state;
  const live = session.status === "active";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function end() {
    setPending(true);
    setError(null);
    const message = await onEnd();
    setPending(false);
    if (message) setError(message);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-black">
          {live ? (
            <Preview playbackId={session.playbackId} />
          ) : (
            <div className="px-6 text-center text-white">
              <span className="mx-auto block size-3 animate-pulse rounded-full bg-[#e5322d]" aria-hidden />
              <p className="mt-3 text-sm font-semibold">Waiting for your broadcast</p>
              <p className="mt-1 text-xs text-white/60">Start streaming from your app. This switches to live on its own.</p>
            </div>
          )}
          {live ? <LiveBadge live="live" className="absolute top-3 left-3" /> : null}
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">{session.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {live ? "You're live in the feed and on your channel." : "Fans will see you in the feed as soon as video arrives."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {live ? (
            <Link href={`/watch/${session.id}`} className="inline-flex h-10 items-center rounded-full border border-line bg-card px-5 text-sm">
              Open viewer page
            </Link>
          ) : null}
          <ActionButton
            type="button"
            onClick={() => void end()}
            pending={pending}
            idle={live ? "End stream" : "Cancel"}
            busy={live ? "Ending" : "Cancelling"}
            className={`h-10 rounded-full px-5 text-sm font-semibold ${live ? "bg-[#e5322d] text-white" : "border border-line bg-card"}`}
          />
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-accent">
            {error}
          </p>
        ) : null}
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-sm font-semibold">Stream settings</h2>
          <p className="mt-1 text-xs text-muted">Keep your stream key private. Anyone with it can stream to your channel.</p>
          <CopyField label="Server" value={ingest.url} />
          <CopyField label="Stream key" value={ingest.streamKey} secret />
        </div>
        <div className="rounded-2xl border border-line bg-card p-4 text-sm leading-6">
          <h2 className="font-semibold">From a computer (OBS)</h2>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-muted">
            <li>Settings, then Stream</li>
            <li>Service: Custom</li>
            <li>Paste the server and stream key</li>
            <li>Press Start Streaming</li>
          </ol>
          <h2 className="mt-3 font-semibold">From your phone</h2>
          <p className="text-muted">Use an RTMP app like Larix Broadcaster. Add a connection with the server and key joined as one URL: server, a slash, then the key.</p>
        </div>
      </aside>
    </div>
  );
}

function Preview({ playbackId }: { playbackId: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useStreamSource(ref, streamUrl(playbackId));
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const play = () => void video.play().catch(() => undefined);
    video.addEventListener("loadedmetadata", play);
    return () => video.removeEventListener("loadedmetadata", play);
  }, []);
  return <video ref={ref} muted playsInline controls aria-label="Your live preview" className="h-full w-full object-contain" />;
}

function CopyField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [shown, setShown] = useState(!secret);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 flex items-center gap-1 rounded-lg border border-line bg-background pl-3">
        <code className="min-w-0 flex-1 truncate py-2 font-mono text-xs">{shown ? value : "•".repeat(24)}</code>
        {secret ? (
          <button type="button" onClick={() => setShown((value) => !value)} className="shrink-0 px-2 py-2 text-xs text-muted hover:text-foreground">
            {shown ? "Hide" : "Show"}
          </button>
        ) : null}
        <button type="button" onClick={() => void copy()} className="shrink-0 rounded-r-lg px-3 py-2 text-xs font-semibold text-accent hover:bg-foreground/5">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

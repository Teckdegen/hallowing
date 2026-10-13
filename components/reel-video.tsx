"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function isStream(src: string | null) {
  return Boolean(src && /\.m3u8(\?|$)/.test(src));
}

/** Attaches Mux HLS streams: Safari plays them natively, other browsers go through hls.js. */
export function useStreamSource(ref: RefObject<HTMLVideoElement | null>, src: string | null) {
  useEffect(() => {
    const video = ref.current;
    if (!video || !src || !isStream(src)) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }
    let cancelled = false;
    let hls: { destroy: () => void } | null = null;
    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        video.src = src;
        return;
      }
      const player = new Hls({ lowLatencyMode: true });
      player.loadSource(src);
      player.attachMedia(video);
      hls = player;
    });
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [ref, src]);
}

export function ReelVideo({
  src,
  poster,
  title,
  active,
  paused,
}: {
  src: string;
  poster?: string | null;
  title: string;
  active: boolean;
  paused: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wide, setWide] = useState(false);
  const stream = isStream(src);
  useStreamSource(videoRef, active ? src : null);

  useEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!active || paused) {
      video.pause();
      return;
    }

    let done = false;
    const unmute = (event?: Event) => {
      const target = event?.target;
      if (target instanceof Element && target.closest("[data-playback-toggle]")) return;
      video.muted = false;
      void video.play().then(() => {
        done = true;
        window.removeEventListener("pointerdown", unmute);
        window.removeEventListener("keydown", unmute);
      }).catch(() => undefined);
    };
    const start = () => {
      if (done) return;
      video.muted = false;
      void video.play().then(() => {
        done = true;
      }).catch(() => {
        video.muted = true;
        void video.play().catch(() => undefined);
        window.addEventListener("pointerdown", unmute);
        window.addEventListener("keydown", unmute);
      });
    };

    start();
    video.addEventListener("loadeddata", start);
    return () => {
      done = true;
      video.removeEventListener("loadeddata", start);
      window.removeEventListener("pointerdown", unmute);
      window.removeEventListener("keydown", unmute);
    };
  }, [active, paused, src]);

  return (
    <video
      ref={videoRef}
      src={stream ? undefined : src}
      poster={poster ?? undefined}
      aria-label={title}
      loop={!stream}
      playsInline
      preload={active ? "auto" : "metadata"}
      onLoadedMetadata={(event) => setWide(event.currentTarget.videoWidth > event.currentTarget.videoHeight)}
      className={`absolute inset-0 h-full w-full ${wide ? "object-contain" : "object-cover"}`}
    />
  );
}

/** A still for grids: the Mux thumbnail when there is one, otherwise the upload's first frame. */
export function VideoThumb({ src, poster, title, className = "" }: { src: string | null; poster?: string | null; title: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);

  if (poster) return <img src={poster} alt={title} loading="lazy" className={`bg-black object-cover ${className}`} />;
  if (!src || isStream(src)) return <div className={`bg-foreground/10 ${className}`} aria-hidden />;
  return (
    <video
      ref={videoRef}
      src={`${src}#t=0.1`}
      aria-label={title}
      muted
      playsInline
      preload="metadata"
      className={`bg-black object-cover ${className}`}
      onMouseEnter={(event) => void event.currentTarget.play().catch(() => undefined)}
      onMouseLeave={(event) => event.currentTarget.pause()}
    />
  );
}

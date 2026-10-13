"use client";

import { useEffect, useRef, useState } from "react";

export function ReelVideo({
  src,
  title,
  active,
  paused,
}: {
  src: string;
  title: string;
  active: boolean;
  paused: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wide, setWide] = useState(false);

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
      src={src}
      aria-label={title}
      loop
      playsInline
      preload={active ? "auto" : "metadata"}
      onLoadedMetadata={(event) => setWide(event.currentTarget.videoWidth > event.currentTarget.videoHeight)}
      className={`absolute inset-0 h-full w-full ${wide ? "object-contain" : "object-cover"}`}
    />
  );
}

/** A still for grids, taken from the first frame of the upload. */
export function VideoThumb({ src, title, className = "" }: { src: string | null; title: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);

  if (!src) return <div className={`bg-foreground/10 ${className}`} aria-hidden />;
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

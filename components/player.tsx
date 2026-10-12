"use client";

import { useState } from "react";
import { Stage } from "@/components/stage";
import type { Stream } from "@/lib/data";

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M4.5 2.8v10.4L13 8 4.5 2.8z" fill="currentColor" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M4 3h2.4v10H4V3zm5.6 0H12v10H9.6V3z" fill="currentColor" />
    </svg>
  );
}

function IconFull() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden>
      <path
        d="M1 5.5V1h4.5M14 5.5V1H9.5M1 9.5V14h4.5M14 9.5V14H9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function Player({ stream }: { stream: Stream }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="bg-black">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setPlaying((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setPlaying((value) => !value);
          }
        }}
        aria-label={playing ? "Pause" : "Play"}
        className="relative block w-full cursor-pointer"
      >
        <Stage scene={stream.scene} drift={playing && stream.live} className="aspect-video w-full">
          <span className="absolute top-3 right-3 text-[10px] tracking-[0.22em] text-white/40">MUX</span>
          {playing ? null : (
            <span className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center border border-white/25 bg-black/70 text-white">
              <IconPlay />
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 flex h-11 items-center gap-3 bg-gradient-to-t from-black/85 to-transparent px-3 text-white">
            {playing ? <IconPause /> : <IconPlay />}
            {stream.live ? (
              <>
                <span className="text-[11px] font-semibold tracking-[0.14em] text-accent">LIVE</span>
                <span className="text-[11px] text-white/70 tabular-nums">4:12:08</span>
              </>
            ) : (
              <span className="text-[11px] text-white/70">{stream.duration}</span>
            )}
            <span className="ml-auto text-white/80">
              <IconFull />
            </span>
          </span>
        </Stage>
      </div>
    </div>
  );
}

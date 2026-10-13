import type { ReactNode } from "react";

export function HauntSky({ children, className = "", moon = true }: { children: ReactNode; className?: string; moon?: boolean }) {
  return (
    <div className={`haunt-sky ${className}`}>
      {moon ? <span className="haunt-moon" aria-hidden /> : null}
      <Bat className="top-10 right-[22%]" size={22} />
      <Bat className="top-24 right-[4%] [animation-delay:-3s]" size={14} />
      <span className="haunt-fog" aria-hidden />
      {children}
    </div>
  );
}

function Bat({ className, size }: { className: string; size: number }) {
  return (
    <span className={`haunt-bat ${className}`} aria-hidden>
      <svg width={size} height={size * 0.55} viewBox="0 0 40 22">
        <path
          fill="currentColor"
          d="M20 8c1.2-2.2 2.2-3 3-3-.2 1 .2 1.8 1 2.4C27 3 33 1 40 3c-4 1.6-6 4-6.4 7.6-2.6-1.4-5.2-.8-6.6 1.6-1.4-1.6-3.6-2-5.4-.4L20 14l-1.6-2.2c-1.8-1.6-4-1.2-5.4.4-1.4-2.4-4-3-6.6-1.6C6 7 4 4.6 0 3c7-2 13 0 16 4.4.8-.6 1.2-1.4 1-2.4.8 0 1.8.8 3 3z"
        />
      </svg>
    </span>
  );
}

export function Candle({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden className={className}>
      <path className="candle-flicker" style={{ transformOrigin: "7px 8px" }} fill="#f6b25c" d="M7 1c2.4 2.6 3 4.4 3 5.6A3 3 0 0 1 7 9.6a3 3 0 0 1-3-3C4 5.4 4.8 3.6 7 1z" />
      <rect x="4" y="10" width="6" height="11" rx="1.5" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
      <Candle className="text-foreground/70" />
      {children}
    </p>
  );
}

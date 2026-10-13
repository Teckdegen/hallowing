export function LiveBadge({ live, className = "" }: { live: "live" | "replay"; className?: string }) {
  if (live === "replay") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase ${className}`}>
        Replay
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-[#e5322d] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase ${className}`}>
      <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
      Live
    </span>
  );
}

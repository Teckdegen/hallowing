import type { Metadata } from "next";
import Link from "next/link";
import { leaderboard, liveFor, type Creator } from "@/lib/data";
import { formatCompact, formatNumber, initials } from "@/lib/format";

export const metadata: Metadata = {
  title: "Leaderboard",
};

const marks: Record<string, string> = {
  nightmarehouse: "#3b82f6",
  ghostcam: "#a855f7",
  cryptkeeper: "#eab308",
  darkroom: "#e8783a",
  scaresquad: "#22c55e",
  hollowstatic: "#14b8a6",
  marrow: "#e11d48",
  ashcache: "#6366f1",
  redporch: "#f43f5e",
  vesper: "#8b5cf6",
  lowsignal: "#64748b",
};

const rings = ["ring-[#e8b15a]", "ring-[#d5d5d5]", "ring-[#c46a32]"];
const medals = ["bg-[#e8b15a]", "bg-[#d5d5d5]", "bg-[#c46a32]"];

export default function LeaderboardPage() {
  const board = leaderboard();
  const [first, second, third, ...rest] = board;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1a1a] px-3 py-1.5 text-sm font-semibold text-accent">
          <Gem />
          2 wks
        </span>
      </header>

      <div className="mt-10 flex items-end justify-center gap-3 sm:gap-6">
        {second ? <Podium creator={second} place={2} /> : null}
        {first ? <Podium creator={first} place={1} /> : null}
        {third ? <Podium creator={third} place={3} /> : null}
      </div>

      {rest.length > 0 ? (
        <ol className="mt-8 rounded-3xl bg-[#121212] px-3 py-2">
          {rest.map((creator, index) => {
            const rank = index + 4;
            const live = liveFor(creator.handle);
            return (
              <li key={creator.handle}>
                <Link
                  href={live ? `/watch/${live.slug}` : `/creators/${creator.handle}`}
                  className="flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-[#1a1a1a]"
                >
                  <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted tabular-nums">{rank}</span>
                  <Mark name={creator.name} handle={creator.handle} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{creator.name}</span>
                    <span className="mt-0.5 block text-xs text-muted tabular-nums">{formatNumber(creator.support)} support</span>
                  </span>
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: marks[creator.handle] ?? "#e8783a" }}
                  >
                    {formatCompact(creator.support)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : null}
    </main>
  );
}

function Podium({ creator, place }: { creator: Creator; place: 1 | 2 | 3 }) {
  const live = liveFor(creator.handle);
  const first = place === 1;
  return (
    <Link
      href={live ? `/watch/${live.slug}` : `/creators/${creator.handle}`}
      className={`flex w-24 flex-col items-center text-center sm:w-28 ${first ? "" : "mb-1"}`}
    >
      {first ? <Crown /> : <span className="h-7" />}
      <span className="relative">
        <span
          className={`grid place-items-center rounded-full font-semibold text-white ring-4 ${rings[place - 1]} ${
            first ? "size-24 text-xl" : "size-16 text-sm"
          }`}
          style={{ background: marks[creator.handle] ?? "#3b82f6" }}
        >
          {initials(creator.name)}
        </span>
        <span
          className={`absolute -bottom-1 left-1/2 grid size-6 -translate-x-1/2 place-items-center rounded-full text-[11px] font-bold text-[#1a0c08] ${medals[place - 1]}`}
        >
          {place}
        </span>
      </span>
      <span className="mt-3 block w-full truncate text-sm font-semibold">{creator.name}</span>
      <span className="mt-0.5 block text-[11px] text-muted tabular-nums">{formatCompact(creator.support)} support</span>
    </Link>
  );
}

function Mark({ name, handle }: { name: string; handle: string }) {
  return (
    <span
      className="grid size-10 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
      style={{ background: marks[handle] ?? "#3b82f6" }}
    >
      {initials(name)}
    </span>
  );
}

function Crown() {
  return (
    <svg width="28" height="22" viewBox="0 0 28 22" aria-hidden className="mb-1 text-[#e8b15a]">
      <path fill="currentColor" d="M3 18h22l-2-9-5 5-4-8-4 8-5-5-2 9z" />
      <circle cx="3" cy="7" r="1.6" fill="currentColor" />
      <circle cx="14" cy="4" r="1.6" fill="currentColor" />
      <circle cx="25" cy="7" r="1.6" fill="currentColor" />
    </svg>
  );
}

function Gem() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path fill="currentColor" d="M7 1.2 12.2 5.2 7 12.8 1.8 5.2 7 1.2z" />
    </svg>
  );
}

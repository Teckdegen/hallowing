"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { ActionButton } from "@/components/action-button";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { HauntSky } from "@/components/haunt";
import { LeaderboardSkeleton } from "@/components/skeletons";
import { giftImage, gifts, shortTokens, type Gift } from "@/lib/gifts";
import { formatCompact } from "@/lib/format";
import { publicMediaUrl, fetchProfilesByWallets, type Profile } from "@/lib/profiles";
import { buildSettleCall, fetchVaultState, formatTokenAmount, type BoardEntry, type VaultState } from "@/lib/vault";

const pageSize = 10;
const payoutSpots = 10;
const medals = ["#e8b15a", "#cfd2d6", "#c46a32"];

export function LeaderboardView() {
  const { user, login } = useAuth();
  const { sendTransaction } = useSendTransaction();
  const [state, setState] = useState<VaultState | null | undefined>(undefined);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<Gift | null>(null);

  useEffect(() => {
    let active = true;
    fetchVaultState()
      .then(async (next) => {
        if (!active) return;
        setState(next);
        if (!next) return;
        const rows = await fetchProfilesByWallets(next.entries.map((entry) => entry.creator));
        if (!active) return;
        setProfiles(Object.fromEntries(rows.flatMap((profile) => (profile.evm_wallet ? [[profile.evm_wallet, profile] as const] : []))));
      })
      .catch(() => {
        if (active) setState(null);
      });
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (state === undefined) return <LeaderboardSkeleton />;

  const board = (state?.entries ?? []).slice(0, 100);
  const entries = filter
    ? board
        .filter((entry) => (entry.received[filter.id] ?? BigInt(0)) > BigInt(0))
        .sort((a, b) => (b.received[filter.id] > a.received[filter.id] ? 1 : b.received[filter.id] < a.received[filter.id] ? -1 : 0))
    : board;
  const score = (entry: BoardEntry) => (filter ? entry.received[filter.id] ?? BigInt(0) : entry.gifted);
  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize));
  const visible = entries.slice(page * pageSize, page * pageSize + pageSize);
  const decimals = state?.decimals ?? 18;
  const ended = state ? now / 1000 >= state.endsAt : false;
  const topTotal = board.slice(0, payoutSpots).reduce((sum, entry) => sum + entry.gifted, BigInt(0));
  const leader = entries[0] ? score(entries[0]) : BigInt(0);
  const mine = user?.evmWallet?.toLowerCase();

  function choose(next: Gift | null) {
    setFilter(next);
    setPage(0);
  }

  async function split() {
    if (!state || !user?.evmWallet || pending) return;
    setPending(true);
    setNotice(null);
    try {
      const call = await buildSettleCall();
      await sendTransaction({ to: call.to, data: call.data, chainId: call.chainId }, { address: user.evmWallet });
      setNotice("Rewards split across the top 10.");
      setState(await fetchVaultState());
    } catch {
      setNotice("Could not split the rewards.");
    } finally {
      setPending(false);
    }
  }

  return (
    <HauntSky>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-12 sm:px-6 sm:pt-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Leaderboard</h1>
        <p className="mt-2 text-sm text-muted">Top 100 creators by gifts</p>

        <dl className="mt-7 grid grid-cols-3 overflow-hidden rounded-2xl border border-line bg-card/80 backdrop-blur">
          <Stat label="Pot" value={state ? formatTokenAmount(state.pool, decimals) : "0"} unit="HALLOW" accent />
          <Stat label={ended ? "Season" : "Closes in"} value={state ? (ended ? "Closed" : countdown(state.endsAt * 1000 - now)) : "Soon"} divider />
          <Stat label="Payout" value="Top 10" unit="80%" divider />
        </dl>

        {state && ended && !state.settled && entries.length > 0 ? (
          <ActionButton
            type="button"
            pending={pending}
            idle="Split top 10"
            busy="Splitting"
            onClick={() => (user ? void split() : login())}
            className="mt-5 h-10 rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08]"
          />
        ) : null}
        {notice ? (
          <p className="mt-3 text-sm text-accent" role="alert">
            {notice}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-muted">{filter ? `Most ${filter.name} received` : "Most gifted overall"}</p>
          <GiftFilter value={filter} onChange={choose} />
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-card/80 backdrop-blur">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="w-14 py-3 pl-4 font-medium sm:w-16 sm:pl-5">
                  Rank
                </th>
                <th scope="col" className="py-3 font-medium">
                  Creator
                </th>
                <th scope="col" className="w-28 py-3 pr-4 text-right font-medium sm:w-40 sm:pr-5">
                  {filter ? "Received" : "Gifted"}
                </th>
                {filter ? null : (
                  <th scope="col" className="hidden w-20 py-3 pr-5 text-right font-medium sm:table-cell">
                    Payout
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((entry, index) => {
                  const rank = page * pageSize + index + 1;
                  return (
                    <Row
                      key={entry.creator}
                      entry={entry}
                      rank={rank}
                      profile={profiles[entry.creator]}
                      decimals={decimals}
                      gift={filter}
                      lead={leader > BigInt(0) ? Number((score(entry) * BigInt(1000)) / leader) / 10 : 0}
                      payout={rank <= payoutSpots && topTotal > BigInt(0) ? Number((entry.gifted * BigInt(8000)) / topTotal) / 100 : null}
                      you={Boolean(mine && entry.creator.toLowerCase() === mine)}
                      lastPaid={!filter && rank === payoutSpots && entries.length > payoutSpots}
                    />
                  );
                })}
            </tbody>
          </table>
          {visible.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-5 py-14 text-center">
              <span className="relative grid size-28 place-items-center">
                <span className="absolute inset-0 rounded-full border border-dashed border-accent/35" aria-hidden />
                <span className="absolute inset-3 rounded-full bg-accent/[0.08] blur-md" aria-hidden />
                {filter ? (
                  <img src={giftImage(filter)} alt="" width={256} height={256} className="ghost-idle relative size-20" />
                ) : (
                  <img src="/ghost.png" alt="" width={256} height={256} className="ghost-idle relative h-auto w-16" />
                )}
              </span>
              <p className="mt-5 text-lg font-semibold">No one yet</p>
              {filter ? <p className="mt-1 text-sm text-muted">Be the first to send a {filter.name}.</p> : null}
            </div>
          ) : null}
        </div>

        {entries.length > pageSize ? (
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Leaderboard pages">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              className="h-9 rounded-full border border-line bg-card px-4 hover:bg-foreground/5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-muted tabular-nums">
              {page + 1} of {pageCount}
            </span>
            <button
              type="button"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((value) => value + 1)}
              className="h-9 rounded-full border border-line bg-card px-4 hover:bg-foreground/5 disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        ) : null}
      </main>
    </HauntSky>
  );
}

function Stat({ label, value, unit, accent = false, divider = false }: { label: string; value: string; unit?: string; accent?: boolean; divider?: boolean }) {
  return (
    <div className={`min-w-0 px-3 py-4 sm:px-5 sm:py-5 ${divider ? "border-l border-line" : ""}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1.5 flex min-w-0 items-baseline gap-1.5">
        <span className={`truncate text-lg font-semibold tabular-nums sm:text-2xl ${accent ? "text-accent" : ""}`}>{value}</span>
        {unit ? <span className="hidden shrink-0 text-xs text-muted sm:inline">{unit}</span> : null}
      </dd>
    </div>
  );
}

function GiftFilter({ value, onChange }: { value: Gift | null; onChange: (gift: Gift | null) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const options: (Gift | null)[] = [null, ...gifts];
  const selected = value ? value.id + 1 : 0;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (open) root.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function show() {
    setActive(selected);
    setOpen(true);
  }

  function pick(index: number) {
    onChange(options[index]);
    setOpen(false);
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        show();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(active);
    }
  }

  return (
    <div ref={root} className="relative shrink-0" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        className={`inline-flex h-10 items-center gap-2 rounded-full border pr-3 pl-3.5 text-sm font-medium transition-colors ${
          value ? "border-accent/60 bg-accent/10 text-foreground" : "border-line bg-card/80 text-foreground hover:bg-foreground/5"
        }`}
      >
        {value ? (
          <img src={giftImage(value)} alt="" width={256} height={256} className="-my-1 -ml-1 size-6" />
        ) : (
          <FilterIcon />
        )}
        <span className="max-w-36 truncate">{value ? value.name : "All gifts"}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Filter by gift"
          className="absolute top-full right-0 z-30 mt-2 max-h-[min(26rem,60vh)] w-64 overflow-y-auto rounded-2xl border border-line bg-card p-1.5 shadow-2xl"
        >
          {options.map((gift, index) => {
            const isSelected = index === selected;
            return (
              <li
                key={gift?.id ?? "all"}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(index)}
                onClick={() => pick(index)}
                className={`flex h-11 cursor-pointer items-center gap-3 rounded-xl px-2.5 text-sm ${index === active ? "bg-foreground/[0.06]" : ""}`}
              >
                {gift ? (
                  <img src={giftImage(gift)} alt="" width={256} height={256} className="size-8 shrink-0" />
                ) : (
                  <span className="grid size-8 shrink-0 place-items-center text-muted">
                    <FilterIcon />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate font-medium">{gift ? gift.name : "All gifts"}</span>
                {gift ? <span className="text-xs text-muted tabular-nums">{shortTokens(gift.price)}</span> : null}
                <span className={`w-4 shrink-0 text-accent ${isSelected ? "" : "invisible"}`} aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M3 7.4 5.8 10 11 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M2.5 4h11M4.5 8h7M6.5 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Row({
  entry,
  rank,
  profile,
  decimals,
  gift,
  lead,
  payout,
  you,
  lastPaid,
}: {
  entry: BoardEntry;
  rank: number;
  profile?: Profile;
  decimals: number;
  gift: Gift | null;
  lead: number;
  payout: number | null;
  you: boolean;
  lastPaid: boolean;
}) {
  const name = profile ? profile.display_name?.trim() || profile.username : shortWallet(entry.creator);
  const medal = medals[rank - 1];
  const creator = (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar
        src={profile ? publicMediaUrl("images", profile.avatar_path) : null}
        seed={profile?.username ?? entry.creator}
        alt=""
        className="size-10 shrink-0"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{name}</span>
          {you ? <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-[#1a0c08]">You</span> : null}
        </span>
        {profile ? <span className="block truncate text-xs text-muted">@{profile.username}</span> : null}
      </span>
    </span>
  );
  return (
    <tr
      className={`transition-colors hover:bg-foreground/[0.03] ${lastPaid ? "border-b border-dashed border-accent/50" : "border-b border-line last:border-b-0"} ${you ? "bg-accent/[0.07]" : ""}`}
    >
      <td className="py-3.5 pl-4 sm:pl-5">
        {medal ? (
          <span className="grid size-7 place-items-center rounded-full text-xs font-bold text-[#1a0c08] tabular-nums" style={{ background: medal }}>
            {rank}
          </span>
        ) : (
          <span className="inline-block w-7 text-center text-sm font-medium text-muted tabular-nums">{rank}</span>
        )}
      </td>
      <td className="py-3.5 pr-3">
        {profile ? (
          <Link href={`/creators/${profile.username}`} className="block hover:opacity-80">
            {creator}
          </Link>
        ) : (
          creator
        )}
      </td>
      <td className="py-3.5 pr-4 text-right sm:pr-5">
        {gift ? (
          <span className="flex items-center justify-end gap-1 font-semibold tabular-nums">
            <img src={giftImage(gift)} alt="" width={256} height={256} className="-my-1 size-6" />×{formatCompact(Number(entry.received[gift.id] ?? BigInt(0)))}
          </span>
        ) : (
          <span className="block font-semibold tabular-nums">{formatTokenAmount(entry.gifted, decimals)}</span>
        )}
        <span className="mt-1.5 ml-auto block h-1 w-full max-w-24 overflow-hidden rounded-full bg-foreground/10" aria-hidden>
          <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(4, lead)}%` }} />
        </span>
      </td>
      {gift ? null : (
        <td className="hidden py-3.5 pr-5 text-right tabular-nums sm:table-cell">
          {payout === null ? <span className="text-faint">0%</span> : <span className="font-medium text-accent">{payout.toFixed(payout < 10 ? 1 : 0)}%</span>}
        </td>
      )}
    </tr>
  );
}

function countdown(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

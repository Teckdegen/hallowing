"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/stream-card";
import type { Creator, Stream } from "@/lib/data";
import { formatNumber } from "@/lib/format";

const amounts = [100, 500, 1000, 2500];

export function WatchBar({ stream, creator }: { stream: Stream; creator: Creator }) {
  const [open, setOpen] = useState(false);
  const [support, setSupport] = useState(creator.support);
  const [balance, setBalance] = useState(12400);
  const [amount, setAmount] = useState(100);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function confirm() {
    if (amount > balance) return;
    setBalance((value) => value - amount);
    setSupport((value) => value + amount);
    setNote(`Backed @${creator.name} with ${formatNumber(amount)} points.`);
    setOpen(false);
  }

  const shortOfPoints = amount > balance;

  const tags = stream.tags.filter((tag) => tag !== "October");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{stream.title}</h1>
          <Link href={`/creators/${creator.handle}`} className="mt-3 flex w-fit max-w-full items-center gap-3">
            <Avatar name={creator.name} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{creator.name}</span>
              <span className="block truncate text-xs text-muted">@{creator.handle}</span>
            </span>
          </Link>
        </div>
        {stream.live ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-1 h-8 shrink-0 rounded-full bg-accent px-3 text-xs font-semibold text-[#1a0c08] hover:brightness-110"
          >
            Back creator
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-xs font-medium text-foreground tabular-nums">
          {formatNumber(support)} support
        </span>
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
            #{tag}
          </span>
        ))}
        {stream.tags.includes("October") ? (
          <Link href="/leaderboard" className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            Leaderboard
          </Link>
        ) : null}
      </div>

      <section className="rounded-2xl bg-card px-4 py-4">
        <h2 className="text-xs font-semibold text-muted">About</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6">{stream.about}</p>
      </section>
      {note ? <p className="text-sm text-accent">{note}</p> : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="back-title"
            className="w-full max-w-md rounded-3xl border border-line bg-card p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[11px] font-semibold tracking-[0.16em] text-accent">HALLOWING POINTS</p>
            <h2 id="back-title" className="mt-2 text-lg font-medium">
              Back @{creator.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Points are support for this creator. They are not a wager, and they are not cash.
            </p>
            <p className="mt-4 text-sm">
              Your balance <span className="tabular-nums">{formatNumber(balance)}</span>
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {amounts.map((value) => {
                const selected = value === amount;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value)}
                    className={`h-10 rounded-full border text-sm tabular-nums ${
                      selected
                        ? "border-accent text-accent"
                        : "border-line text-foreground hover:border-[#3a3a3a]"
                    }`}
                  >
                    {formatNumber(value)}
                  </button>
                );
              })}
            </div>
            {shortOfPoints ? (
              <p className="mt-3 text-sm text-accent">Not enough points for that amount.</p>
            ) : null}
            <button
              type="button"
              disabled={shortOfPoints}
              onClick={confirm}
              className="mt-4 h-10 w-full rounded-full bg-accent text-sm font-semibold text-[#1a0c08] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back with {formatNumber(amount)}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 h-10 w-full rounded-full text-sm text-muted hover:bg-[#1a1a1a] hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

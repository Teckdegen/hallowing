"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";

const amounts = [100, 500, 1000, 2500];

export function BackCreatorButton({
  name,
  onBacked,
}: {
  name: string;
  onBacked?: (amount: number) => void;
}) {
  const [open, setOpen] = useState(false);
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

  const shortOfPoints = amount > balance;

  function confirm() {
    if (shortOfPoints) return;
    setBalance((value) => value - amount);
    onBacked?.(amount);
    setNote(`Backed @${name} with ${formatNumber(amount)} points.`);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-8 shrink-0 rounded-full bg-accent px-3 text-xs font-semibold text-[#1a0c08] hover:brightness-110"
      >
        Back creator
      </button>
      {note ? <span className="sr-only">{note}</span> : null}
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="back-title"
            className="w-full max-w-md border border-line bg-card p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[11px] font-semibold tracking-[0.16em] text-accent">HALLOWING POINTS</p>
            <h2 id="back-title" className="mt-2 text-lg font-medium">
              Back @{name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Points are support for this creator. They are not a wager, and they are not cash.
            </p>
            <p className="mt-4 text-sm">
              Your balance <span className="tabular-nums">{formatNumber(balance)}</span>
            </p>
            {note ? <p className="mt-2 text-sm text-accent">{note}</p> : null}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {amounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  className={`h-10 border text-sm tabular-nums ${
                    value === amount ? "border-accent text-accent" : "border-line hover:border-[#3a3a3a]"
                  }`}
                >
                  {formatNumber(value)}
                </button>
              ))}
            </div>
            {shortOfPoints ? <p className="mt-3 text-sm text-accent">Not enough points for that amount.</p> : null}
            <button
              type="button"
              disabled={shortOfPoints}
              onClick={confirm}
              className="mt-4 h-10 w-full bg-accent text-sm font-semibold text-[#1a0c08] disabled:opacity-40"
            >
              Back with {formatNumber(amount)}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="mt-2 h-10 w-full text-sm text-muted">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

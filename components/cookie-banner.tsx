"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const storageKey = "hallowing-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!localStorage.getItem(storageKey));
  }, []);

  function choose(value: "accepted" | "declined") {
    localStorage.setItem(storageKey, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl border border-line bg-card p-4 shadow-2xl sm:flex-row sm:items-center sm:px-5">
      <p className="min-w-0 flex-1 text-sm text-muted">
        Hallowing stores your theme and this choice on this device. Sign-in and uploads also use Privy and Supabase. Read the{" "}
        <Link href="/privacy" className="text-foreground underline">
          privacy policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="text-foreground underline">
          terms
        </Link>
        .
      </p>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => choose("declined")} className="h-10 rounded-full px-4 text-sm hover:bg-foreground/5">
          Decline
        </button>
        <button type="button" onClick={() => choose("accepted")} className="h-10 rounded-full bg-accent px-4 text-sm font-semibold text-[#1a0c08]">
          Accept
        </button>
      </div>
    </div>
  );
}

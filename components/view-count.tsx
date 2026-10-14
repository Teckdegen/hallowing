"use client";

import { useEffect, useState } from "react";
import { fetchViewCount } from "@/lib/views";

export function viewLabel(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? "view" : "views"}`;
}

export function ViewCount({ videoKey, className = "" }: { videoKey: string; className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchViewCount(videoKey).then((next) => {
        if (!cancelled && next !== null) setCount(next);
      });
    void load();
    const onView = (event: Event) => {
      if ((event as CustomEvent<string>).detail === videoKey) void load();
    };
    window.addEventListener("hallowing:view", onView);
    return () => {
      cancelled = true;
      window.removeEventListener("hallowing:view", onView);
    };
  }, [videoKey]);

  if (count === null) return null;
  return <span className={className}>{viewLabel(count)}</span>;
}

export function notifyView(videoKey: string) {
  window.dispatchEvent(new CustomEvent("hallowing:view", { detail: videoKey }));
}

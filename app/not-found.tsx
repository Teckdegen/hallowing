import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, HauntSky } from "@/components/haunt";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That Hallowing page drifted off. Head back to the feed, browse creators, or check the leaderboard.",
};

export default function NotFound() {
  return (
    <HauntSky className="flex-1">
      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <img src="/ghost.png" alt="" width={256} height={256} className="ghost-idle h-auto w-24" />
        <div className="mt-6">
          <Eyebrow>404</Eyebrow>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">This page drifted off.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">The link may be old, or the video lives somewhere else now.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/" className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08]">
            Back to the feed
          </Link>
          <Link href="/browse" className="inline-flex h-10 items-center rounded-full border border-line bg-card px-5 text-sm">
            Browse
          </Link>
          <Link href="/leaderboard" className="inline-flex h-10 items-center rounded-full border border-line bg-card px-5 text-sm">
            Leaderboard
          </Link>
        </div>
      </main>
    </HauntSky>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { HauntSky } from "@/components/haunt";
import { PostedView } from "@/components/posted-view";

export const metadata: Metadata = {
  title: "Haunt posted",
  description: "Your haunt was posted.",
  robots: { index: false },
};

export default function ThanksPage() {
  return (
    <HauntSky>
      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-lg flex-col items-center justify-center px-4 py-16 sm:px-6">
        <Suspense>
          <PostedView />
        </Suspense>
      </main>
    </HauntSky>
  );
}

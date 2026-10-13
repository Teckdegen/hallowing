import type { ReactNode } from "react";
import { Eyebrow, HauntSky } from "@/components/haunt";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <HauntSky>
      <main className="mx-auto w-full max-w-2xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
        <Eyebrow>The fine print</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <div className="mt-8 space-y-4 rounded-3xl border border-line bg-card/80 p-5 text-sm leading-7 text-muted backdrop-blur sm:p-7">{children}</div>
      </main>
    </HauntSky>
  );
}

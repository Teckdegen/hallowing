import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, HauntSky } from "@/components/haunt";
import { giftImage, gifts, shortTokens } from "@/lib/gifts";

export const metadata: Metadata = {
  title: "How it works",
  description: "One Hallowing season, from the first prank to the midnight split. Post, get found, get gifted, and share the pot.",
};

const night = [
  {
    hour: "Dusk",
    phase: 0.15,
    title: "Post your best prank",
    body: "Upload a haunt, up to 1:30, give it a caption and a few tags, and choose who can comment. Your channel keeps every haunt you post this season.",
    detail: "Harmless pranks travel furthest. The reveal is the moment people replay.",
  },
  {
    hour: "Moonrise",
    phase: 0.45,
    title: "Haunt the feed",
    body: "Home is an endless reel. The video in front of you plays with sound, a tap in the center pauses it, and a swipe brings the next scare. Likes, comments, and shares sit beside every video.",
    detail: "Follows and comments build your crowd. Your crowd is who gifts you next.",
  },
  {
    hour: "Full moon",
    phase: 1,
    title: "Fans send gifts",
    body: "Anyone holding HALLOW taps Gift beside a video, picks from ten Hallowing gifts, sets how many, and sends. Every gift adds its HALLOW value to that creator's total and moves them up the board.",
    detail: "After sending, share it to X, Threads, Instagram, and more. We tag the creator on that platform for you.",
  },
  {
    hour: "Midnight",
    phase: 0.62,
    title: "The split",
    body: "When the season clock hits zero, gifting closes and the board freezes. The top 10 share 80% of the pot, each sized by the gifts they pulled in. The other 20% stays in the vault.",
    detail: "Anyone can ring the midnight bell with Split top 10 on the leaderboard once the season closes.",
  },
] as const;

const rules = [
  { title: "Keep it kind", body: "Everyone laughs at the end, including the person who got pranked." },
  { title: "Real reactions", body: "Staged is fine when you say so in the caption. Fans love honesty." },
  { title: "Safe scares", body: "No danger, no damage, no one hurt. Spooky beats risky every time." },
  { title: "Credit the crew", body: "Tag the people who helped. Good crews get gifted together." },
] as const;

const whispers = [
  {
    q: "How long is a season?",
    a: "Each season has its own clock. The countdown on the leaderboard shows exactly when gifting closes.",
  },
  {
    q: "How do I climb the board?",
    a: "Rank comes from the total HALLOW value of the gifts you receive. Post often, reply to comments, and share your videos so fans find the Gift button.",
  },
  {
    q: "How is my share worked out?",
    a: "Add up the gift value held by the top 10. Your slice of the 80% matches your slice of that total.",
  },
  {
    q: "Who sees the top 100?",
    a: "Everyone. The leaderboard lists the 100 most gifted creators, ten per page, with a payout line under tenth place. Filter by any gift to see who gets the most Haunted Manors or Candy Corns.",
  },
  {
    q: "What happens to my channel after the season?",
    a: "Your videos, followers, and comments stay on your channel, ready for the next season.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <HauntSky>
      <main className="mx-auto w-full max-w-3xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <Eyebrow>A season on Hallowing</Eyebrow>
        <h1 className="mt-4 max-w-xl text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          One night.
          <br />
          <span className="text-accent">Four moons.</span>
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted">
          Every Hallowing season plays out like a long night. Creators post their funniest pranks, fans gift the ones they love, and at midnight the top 10 split the pot.
        </p>

        <ol className="relative mt-14">
          <span className="absolute top-6 bottom-6 left-6 w-px bg-gradient-to-b from-accent/70 via-line to-accent/40" aria-hidden />
          {night.map((step, index) => (
            <li key={step.hour} className="relative flex gap-4 pb-8 last:pb-0 sm:gap-6">
              <MoonPhase lit={step.phase} id={`moon-${index}`} />
              <div className="min-w-0 flex-1 rounded-3xl border border-line bg-card/80 p-5 backdrop-blur sm:p-6">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
                  {String(index + 1).padStart(2, "0")} Â· {step.hour}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
                <p className="mt-4 border-l-2 border-accent/60 pl-3 text-sm leading-6 text-foreground/85">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-16" aria-labelledby="gifts-title">
          <Eyebrow>The gift list</Eyebrow>
          <h2 id="gifts-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Ten ways to say boo
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {gifts.map((gift) => (
              <li key={gift.id} className="flex flex-col items-center rounded-3xl border border-line bg-card/80 px-2 pt-3 pb-4 text-center backdrop-blur">
                <img src={giftImage(gift)} alt="" width={256} height={256} className="size-16" />
                <p className="mt-2 text-sm font-medium">{gift.name}</p>
                <p className="text-xs text-muted tabular-nums">{shortTokens(gift.price)} HALLOW</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="pot-title">
          <Eyebrow>The pot</Eyebrow>
          <h2 id="pot-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            How the split lands
          </h2>
          <div className="mt-6 rounded-3xl border border-line bg-card/80 p-5 backdrop-blur sm:p-6">
            <div className="flex h-4 overflow-hidden rounded-full" aria-hidden>
              <span className="w-4/5 bg-accent" />
              <span className="w-1/5 bg-foreground/15" />
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span>
                <span className="font-semibold text-accent">80%</span> to the top 10
              </span>
              <span className="text-muted">20% stays in the vault</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat value="10M" label="HALLOW in the pot" />
              <Stat value="8M" label="shared by the top 10" />
              <Stat value="2M" label="for a creator holding 25% of top 10 gifts" />
            </div>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="rules-title">
          <Eyebrow>House rules</Eyebrow>
          <h2 id="rules-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Pranks people replay
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {rules.map((rule) => (
              <div key={rule.title} className="rounded-3xl border border-line bg-card/80 p-5 backdrop-blur">
                <h3 className="font-semibold">{rule.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{rule.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="whispers-title">
          <Eyebrow>Whispers</Eyebrow>
          <h2 id="whispers-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Things people ask at midnight
          </h2>
          <div className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card/80 backdrop-blur">
            {whispers.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground/5 text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-col items-center rounded-3xl border border-accent/30 bg-accent/[0.07] px-6 py-10 text-center">
          <img src="/ghost.png" alt="" width={256} height={256} className="ghost-idle h-auto w-16" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">The night is young</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/create" className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08]">
              Post a prank
            </Link>
            <Link href="/leaderboard" className="inline-flex h-10 items-center rounded-full border border-line bg-card px-5 text-sm font-medium">
              See the board
            </Link>
          </div>
        </div>
      </main>
    </HauntSky>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.04] p-4">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{label}</p>
    </div>
  );
}

function MoonPhase({ lit, id }: { lit: number; id: string }) {
  return (
    <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full border border-line bg-background" aria-hidden>
      <svg width="30" height="30" viewBox="0 0 30 30">
        <defs>
          <clipPath id={id}>
            <circle cx="15" cy="15" r="11" />
          </clipPath>
        </defs>
        <circle cx="15" cy="15" r="11" fill="#f2b980" />
        <circle cx={15 - lit * 22} cy="15" r="11" fill="var(--background)" clipPath={`url(#${id})`} opacity={lit === 1 ? 0 : 1} />
        <circle cx="15" cy="15" r="11" fill="none" stroke="#f2b980" strokeOpacity="0.5" />
      </svg>
    </span>
  );
}

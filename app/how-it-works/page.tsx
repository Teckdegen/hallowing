import type { Metadata } from "next";
import Link from "next/link";
import { giftImage, gifts, shortTokens } from "@/lib/gifts";

export const metadata: Metadata = {
  title: "How it works",
  description: "How a Hallowing season works: post a haunt, get gifted, and split the pot at midnight.",
};

const contents = [
  { href: "#post", label: "Post a haunt" },
  { href: "#feed", label: "The feed" },
  { href: "#gifts", label: "Gifts" },
  { href: "#split", label: "The split" },
  { href: "#rules", label: "House rules" },
  { href: "#after", label: "After midnight" },
] as const;

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-10 pb-24 sm:px-6 sm:pt-14">
      <p className="text-sm text-muted">How it works</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">A season on Hallowing</h1>
      <p className="mt-4 text-base leading-7 text-foreground/80">
        You post a short haunt, people watch it, and the ones they love get gifts in HALLOW. When the season clock hits zero, the top 10 split most of the pot. Your channel stays up after that.
      </p>

      <nav aria-label="On this page" className="mt-8 border-y border-line py-4">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">On this page</p>
        <ol className="mt-2 space-y-1 text-sm">
          {contents.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="text-foreground/80 hover:text-accent">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="post" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">Post a haunt</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          A haunt is a clip of 1:30 or shorter. Open Upload a haunt, drop the file in, and give it a title, a caption, and a few tags. Then choose who can comment and who can watch. It lands on your channel and, if you set it to public, in the feed.
        </p>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Harmless pranks travel furthest. The reveal is the part people replay. If a scare is staged, say so in the caption. Tag the people who helped. A good crew gets gifted together.
        </p>
      </section>

      <section id="feed" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">The feed</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Home is a reel. The haunt in front of you plays with sound. Tap the middle to pause it, and swipe for the next scare. Likes, comments, and shares sit beside it. A view counts once for each person: after the clip has been on screen for a couple of seconds in the feed, or as soon as they open the watch page.
        </p>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Follows and comments are how a crowd finds you. That crowd is who sends gifts. Your follower count sits on your channel, under your name.
        </p>
      </section>

      <section id="gifts" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">Gifts</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Anyone holding HALLOW taps Gift beside a haunt, picks one of the ten gifts below, sets how many, and sends. The HALLOW value lands on that creator and moves them up the board. After sending, they can share it to X, Threads, Instagram, and the rest. We tag the creator on that platform.
        </p>
        <ul className="mt-5 space-y-3">
          {gifts.map((gift) => (
            <li key={gift.id} className="flex items-center gap-3 text-base leading-7">
              <img src={giftImage(gift)} alt="" width={32} height={32} className="size-8 shrink-0" />
              <span>
                <span className="font-medium">{gift.name}</span>
                <span className="text-muted">, {shortTokens(gift.price)} HALLOW</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section id="split" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">The split</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Each season has its own clock. The countdown on the leaderboard is the moment gifting closes. When it hits zero, the board freezes. The top 10 share 80% of the pot, each sized by the gifts they pulled in. The other 20% stays in the vault.
        </p>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Add up the gift value held by the top 10. Your slice of the 80% matches your slice of that total. If the pot were 10 million HALLOW and you held a quarter of the gifts among the top 10, your share would be 2 million. Anyone can ring the midnight bell with Split top 10 on the leaderboard once the season closes.
        </p>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Everyone can see the board. It lists the 100 most gifted creators, ten per page, with a payout line under tenth place. Filter by a gift to see who receives the most of that one.
        </p>
      </section>

      <section id="rules" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">House rules</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Keep it kind. Everyone laughs at the end, including the person who got pranked. Real reactions are the point, and staged is fine when the caption says so. No danger, no damage, no one hurt. Spooky beats risky every time.
        </p>
      </section>

      <section id="after" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">After midnight</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Your haunts, followers, and comments stay on your channel, ready for the next season. Rank comes from the HALLOW value of the gifts you receive, so post often, reply to comments, and share your haunts so fans find the Gift button.
        </p>
        <p className="mt-6 text-base leading-7">
          <Link href="/create" className="font-medium text-accent hover:underline">
            Upload a haunt
          </Link>
          <span className="px-2 text-muted">·</span>
          <Link href="/leaderboard" className="font-medium text-accent hover:underline">
            See the board
          </Link>
        </p>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { giftImage, gifts, shortTokens } from "@/lib/gifts";

export const metadata: Metadata = {
  title: "How it works",
  description: "How a Hallowing season works, from posting a haunt to the top 10 splitting the pot.",
};

const contents = [
  {
    href: "#haunt",
    title: "A haunt",
    detail: "A short clip, 1:30 or under, posted to your channel.",
  },
  {
    href: "#post",
    title: "Posting one",
    detail: "Upload the file, name it, and choose who can watch.",
  },
  {
    href: "#feed",
    title: "The feed",
    detail: "Home plays haunts one at a time. A view is counted once per person.",
  },
  {
    href: "#gifts",
    title: "Gifts",
    detail: "Fans send HALLOW. That gift value is your score for the season.",
  },
  {
    href: "#board",
    title: "The board",
    detail: "The 100 most gifted creators, with a countdown to the close.",
  },
  {
    href: "#rules",
    title: "House rules",
    detail: "The scare ends with everyone laughing, including the person who got pranked.",
  },
  {
    href: "#split",
    title: "The top 10 split",
    detail: "When the season ends, the ten winners share the season pot.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-10 pb-24 sm:px-6 sm:pt-14">
      <p className="text-sm text-muted">How it works</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">A season on Hallowing</h1>
      <div className="mt-5 space-y-4 text-base leading-7 text-foreground/80">
        <p>
          A season is one run of the clock. You post short haunts. People watch them, follow you, and send gifts paid in HALLOW on Solana. Each gift is a HALLOW transfer into the Hallowing escrow wallet, and Supabase keeps who sent what to which creator. That total is your score. The leaderboard ranks creators by that score and shows the time left.
        </p>
        <p>
          When that clock hits zero, gifting for the season stops. The top creators on the board go home with a share of the pot that built up in escrow. The walkthrough below is the whole path, from the first upload to that payout.
        </p>
      </div>

      <nav aria-label="Table of contents" className="mt-10">
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Contents</h2>
        <ol className="mt-3 divide-y divide-line border-y border-line">
          {contents.map((item, index) => (
            <li key={item.href}>
              <a href={item.href} className="flex gap-4 py-3 hover:text-accent">
                <span className="w-6 shrink-0 pt-0.5 text-sm tabular-nums text-muted">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-muted">{item.detail}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="haunt" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">A haunt</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          A haunt is the video you post. It has to be 1:30 or shorter, and 30 MB or smaller. The title is what people read in the feed. The filename stays on your computer. A caption can say what happened, and tags help people search for it later.
        </p>
      </section>

      <section id="post" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">Posting one</h2>
        <div className="mt-3 space-y-4 text-base leading-7 text-foreground/80">
          <p>
            Open Upload a haunt and drop the file in. The page checks the length before it takes the file. Then you add the title, the caption, and the tags, choose who can comment, and choose who can watch. Public haunts go on your channel and into the feed. Unlisted and private ones stay off the feed.
          </p>
          <p>
            Harmless pranks travel furthest. The reveal is the part people replay. If a scare is staged, say so in the caption, and tag the people who helped. A crew that shows up in the caption is easier to gift.
          </p>
        </div>
      </section>

      <section id="feed" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">The feed</h2>
        <div className="mt-3 space-y-4 text-base leading-7 text-foreground/80">
          <p>
            Home is one haunt at a time, full screen, with sound. Tap the middle to pause. Swipe up for the next one. The creator, the title, the tags, and the view count sit along the bottom. Likes, comments, gifts, and share sit on the right.
          </p>
          <p>
            A view counts once for each person. In the feed that happens after the haunt has been on screen for a couple of seconds. Opening the watch page counts immediately. Follows live on your channel, under your name, and comments use the photo that is on your profile now.
          </p>
        </div>
      </section>

      <section id="gifts" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">Gifts</h2>
        <div className="mt-3 space-y-4 text-base leading-7 text-foreground/80">
          <p>
            Gift is the button beside a haunt. A fan picks one of the ten gifts, chooses how many (up to 99), and sends that HALLOW amount from their Solana wallet into the Hallowing escrow. The price below is for one gift. Two Pumpkin Puffs cost twice that. The transfer is recorded for that creator (and the haunt, when you gift from a watch page), so your season score moves up the board.
          </p>
          <p>After a gift lands, the sender can share it to X, Threads, Instagram, and the other apps. That share tags you on the platform they pick.</p>
        </div>
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

      <section id="board" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">The board</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          The leaderboard lists the 100 most gifted creators, ten to a page. The pot at the top is the HALLOW already gifted into escrow this season. The countdown next to it is the close of the season. You can filter the list by a single gift to see who receives the most of that one.
        </p>
      </section>

      <section id="rules" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">House rules</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">
          Keep it kind. Everyone laughs at the end, including the person who got pranked. Real reactions are the point, and a staged scare is welcome when the caption says so. No danger, no damage, no one hurt. A spooky room beats a risky one.
        </p>
      </section>

      <section id="split" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">The top 10 split</h2>
        <div className="mt-3 space-y-4 text-base leading-7 text-foreground/80">
          <p>
            This is the end of a season. The countdown on the leaderboard reaches zero, the board freezes, and new gifts stop counting toward this pot. The winners are the ten creators with the most HALLOW gifted to them. Rank is that gift total, tallied from the gifts table.
          </p>
          <p>
            The pot is every HALLOW gift that landed in escrow during the season. The top creators go home with a share of that pot. Places 11 through 100 stay on the board so people can see the season, and every channel stays up for the next run.
          </p>
          <p>
            Your haunts, follows, and comments remain on your channel for the next season. A new clock starts its own pot. Post often, reply to comments, and share the haunt so people can find Gift.
          </p>
        </div>
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

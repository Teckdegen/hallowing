import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { Player } from "@/components/player";
import { StreamCard } from "@/components/stream-card";
import { WatchBar } from "@/components/watch-bar";
import { getCreator, getStream, streams, streamsFor } from "@/lib/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return streams.map((stream) => ({ slug: stream.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stream = getStream(slug);
  return { title: stream?.title ?? "Stream" };
}

export default function WatchPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="px-5 py-8 text-sm text-muted">Loading.</p>}>
      <WatchScreen params={params} />
    </Suspense>
  );
}

async function WatchScreen({ params }: Props) {
  const { slug } = await params;
  const stream = getStream(slug);
  const creator = stream ? getCreator(stream.handle) : undefined;
  if (!stream || !creator) notFound();

  const more = streamsFor(creator.handle).filter((item) => item.slug !== stream.slug);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0">
        <Player stream={stream} />
        <div className="px-4 py-5 lg:px-5">
          <WatchBar stream={stream} creator={creator} />
          {more.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-[11px] font-semibold tracking-[0.16em] text-muted">
                MORE FROM @{creator.name}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {more.map((item) => (
                  <StreamCard key={item.slug} stream={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
      <aside className="border-t border-line lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:border-t-0 lg:border-l">
        <ChatPanel live={stream.live} viewers={stream.viewers} />
      </aside>
    </div>
  );
}

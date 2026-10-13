import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchSkeleton } from "@/components/skeletons";
import { WatchView } from "@/components/watch-view";

type Props = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Watch",
  description: "Watch Hallowing videos, comment, and send gifts to creators.",
};

export default function WatchPage({ params }: Props) {
  return (
    <Suspense fallback={<WatchSkeleton />}>
      <WatchScreen params={params} />
    </Suspense>
  );
}

async function WatchScreen({ params }: Props) {
  const { slug } = await params;
  return <WatchView id={slug} />;
}

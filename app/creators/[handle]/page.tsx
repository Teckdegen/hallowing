import type { Metadata } from "next";
import { Suspense } from "react";
import { ChannelView } from "@/components/channel-view";
import { ProfileSkeleton } from "@/components/skeletons";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle}`,
    description: `Watch @${handle} on Hallowing and send gifts to climb the leaderboard.`,
  };
}

export default function CreatorPage({ params }: Props) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <CreatorScreen params={params} />
    </Suspense>
  );
}

async function CreatorScreen({ params }: Props) {
  const { handle } = await params;
  return <ChannelView handle={handle} />;
}

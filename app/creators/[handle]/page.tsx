import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileView } from "@/components/profile-view";
import { creators, getCreator } from "@/lib/data";

type Props = {
  params: Promise<{ handle: string }>;
};

export function generateStaticParams() {
  return creators.map((creator) => ({ handle: creator.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const creator = getCreator(handle);
  return { title: creator ? `@${creator.name}` : "Creator" };
}

export default function CreatorPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="px-6 py-8 text-sm text-muted">Loading.</p>}>
      <CreatorScreen params={params} />
    </Suspense>
  );
}

async function CreatorScreen({ params }: Props) {
  const { handle } = await params;
  const creator = getCreator(handle);
  if (!creator) notFound();
  return <ProfileView creator={creator} />;
}

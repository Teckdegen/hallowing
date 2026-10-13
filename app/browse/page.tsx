import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseView } from "@/components/browse-view";
import { BrowseSkeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "Browse",
  description: "Search Hallowing videos, creators, and hashtags.",
};

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <BrowseView />
    </Suspense>
  );
}

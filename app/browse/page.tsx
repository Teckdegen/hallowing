import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseView } from "@/components/browse-view";

export const metadata: Metadata = {
  title: "Browse",
};

export default function BrowsePage() {
  return (
    <Suspense fallback={<p className="px-6 py-8 text-sm text-muted">Loading.</p>}>
      <BrowseView />
    </Suspense>
  );
}

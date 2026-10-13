import type { Metadata } from "next";
import { LiveStudio } from "@/components/live-studio";

export const metadata: Metadata = {
  title: "Go live",
  description: "Stream live to your Hallowing channel from OBS or your phone.",
  robots: { index: false },
};

export default function LivePage() {
  return <LiveStudio />;
}

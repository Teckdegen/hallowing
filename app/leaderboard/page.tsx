import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top 100 Hallowing creators by gifts. The top 10 split 80% of the vault when the period ends.",
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}

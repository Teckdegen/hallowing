import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top 100 Hallowing creators by HALLOW gifts on Solana. The top 10 share the season pot.",
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}

import type { Metadata } from "next";
import { HomeView } from "@/components/home-view";

export const metadata: Metadata = {
  title: "For you",
  description: "Scroll horror and prank haunts from Hallowing creators, with comments beside the reel.",
};

export default function HomePage() {
  return <HomeView />;
}

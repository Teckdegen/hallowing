import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const now = new Date();
  return ["", "/browse", "/create", "/leaderboard", "/how-it-works", "/privacy", "/terms", "/thanks"].map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));
}

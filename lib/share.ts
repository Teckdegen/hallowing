import type { Socials, SocialPlatform } from "@/lib/profiles";

export const shareTargets = ["x", "threads", "instagram", "tiktok", "facebook", "whatsapp", "telegram"] as const;
export type ShareTarget = (typeof shareTargets)[number];

const tagged: Partial<Record<ShareTarget, SocialPlatform>> = {
  x: "x",
  threads: "threads",
  instagram: "instagram",
  tiktok: "tiktok",
};

export function creatorTag(target: ShareTarget, socials: Socials, username: string) {
  const platform = tagged[target];
  const handle = platform ? socials[platform] : undefined;
  return `@${handle || username}`;
}

export function giftShareText(gift: string, tag: string) {
  return `I just gifted ${gift} to ${tag} on Hallowing. Join me and send your favorite creators some love this season.`;
}

export function shareHref(target: ShareTarget, text: string, url: string) {
  const both = `${text} ${url}`;
  switch (target) {
    case "x":
      return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${encodeURIComponent(both)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(both)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    case "instagram":
      return "https://www.instagram.com/";
    case "tiktok":
      return "https://www.tiktok.com/upload";
  }
}

export function copiesCaption(target: ShareTarget) {
  return target === "instagram" || target === "tiktok";
}

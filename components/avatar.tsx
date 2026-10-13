"use client";

export const characters = ["vampire", "witch", "mummy", "skeleton", "pumpkin", "werewolf", "monster", "zombie", "cat", "scarecrow"] as const;

export function characterImage(seed: string) {
  let hash = 2166136261;
  for (const char of seed || "hallowing") {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `/characters/${characters[(hash >>> 0) % characters.length]}.jpg`;
}

export function Avatar({
  src,
  alt = "",
  seed = "",
  className = "size-8",
}: {
  src: string | null;
  alt?: string;
  seed?: string;
  className?: string;
}) {
  return (
    <span className={`grid shrink-0 overflow-hidden rounded-full bg-foreground/10 ${className}`}>
      <img src={src || characterImage(seed)} alt={alt} width={256} height={256} className="h-full w-full object-cover" />
    </span>
  );
}

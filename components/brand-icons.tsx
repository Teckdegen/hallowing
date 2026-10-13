import { siFacebook, siInstagram, siTelegram, siThreads, siTiktok, siWhatsapp, siX, siYoutube } from "simple-icons";

export type Brand = "x" | "instagram" | "tiktok" | "youtube" | "threads" | "facebook" | "whatsapp" | "telegram";

const marks: Record<Brand, { title: string; hex: string; path: string }> = {
  x: siX,
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube,
  threads: siThreads,
  facebook: siFacebook,
  whatsapp: siWhatsapp,
  telegram: siTelegram,
};

export function brandName(brand: Brand) {
  return marks[brand].title;
}

export function BrandBadge({ brand, className = "size-11", glyph = 20 }: { brand: Brand; className?: string; glyph?: number }) {
  const mark = marks[brand];
  const dark = mark.hex === "000000";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full ${dark ? "border border-white/15" : ""} ${className}`}
      style={{ background: `#${mark.hex}` }}
      aria-hidden
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="#fff">
        <path d={mark.path} />
      </svg>
    </span>
  );
}

export function BrandGlyph({ brand, size = 16 }: { brand: Brand; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={marks[brand].path} />
    </svg>
  );
}

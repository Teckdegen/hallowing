import Link from "next/link";
import { Stage } from "@/components/stage";
import { getCreator, type Stream } from "@/lib/data";
import { formatNumber, initials } from "@/lib/format";

export function Avatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "lg";
}) {
  const box =
    size === "lg"
      ? "size-20 border-4 border-background text-base"
      : "size-9 border border-line text-[10px]";

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#1a1a1a] font-medium text-muted ${box}`}
    >
      {initials(name)}
    </span>
  );
}

export function StreamCard({ stream }: { stream: Stream }) {
  const creator = getCreator(stream.handle);
  if (!creator) return null;

  const watchHref = `/watch/${stream.slug}`;
  const profileHref = `/creators/${creator.handle}`;

  return (
    <article>
      <Link href={watchHref} className="group block">
        <Stage scene={stream.scene} className="aspect-video">
          {stream.live ? (
            <>
              <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.12em]">
                <span className="live-dot size-1.5 bg-accent" />
                LIVE
              </span>
              <span className="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 text-[11px] text-white">
                {formatNumber(stream.viewers)} watching
              </span>
            </>
          ) : (
            <span className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 text-[11px] text-white">
              {stream.duration}
            </span>
          )}
        </Stage>
      </Link>
      <div className="mt-2.5 flex gap-2.5">
        <Link href={profileHref} aria-label={`@${creator.name}`}>
          <Avatar name={creator.name} />
        </Link>
        <div className="min-w-0">
          <Link href={watchHref} className="block truncate text-sm font-medium hover:text-accent">
            {stream.title}
          </Link>
          <Link href={profileHref} className="mt-0.5 block text-xs text-muted hover:text-foreground">
            @{creator.name}
          </Link>
        </div>
      </div>
    </article>
  );
}

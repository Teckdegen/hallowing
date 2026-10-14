import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { VideoThumb } from "@/components/reel-video";
import { timeAgo, type Video } from "@/lib/videos";
import { ViewCount } from "@/components/view-count";

export function VideoTile({ video, showCreator = true, wide = false }: { video: Video; showCreator?: boolean; wide?: boolean }) {
  return (
    <article>
      <Link
        href={`/watch/${video.id}`}
        data-ghost-haunt
        className={`group relative block overflow-hidden rounded-xl bg-foreground/5 ${wide ? "aspect-video" : "aspect-[3/4]"}`}
      >
        <VideoThumb src={video.src} title={video.title} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 to-transparent" aria-hidden />
        {video.watch === "Friends" ? (
          <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Unlisted</span>
        ) : video.watch === "Only you" ? (
          <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Private</span>
        ) : null}
        <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 text-xs font-semibold text-white">
          <PlayIcon />
          {timeAgo(video.createdAt)}
          <span className="px-1">·</span>
          <ViewCount videoKey={video.id} />
        </span>
      </Link>
      <Link href={`/watch/${video.id}`} className="mt-2 line-clamp-2 text-sm leading-5 font-medium hover:text-accent">
        {video.title}
      </Link>
      {showCreator ? (
        <Link href={`/creators/${video.creator.username}`} className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted hover:text-foreground">
          <Avatar src={video.creator.avatar} seed={video.creator.username} className="size-5" />
          <span className="truncate">{video.creator.name}</span>
        </Link>
      ) : null}
    </article>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path d="M3 1.8v8.4L10 6 3 1.8z" fill="currentColor" />
    </svg>
  );
}

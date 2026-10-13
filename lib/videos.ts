import { createClient } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";
import { channelName, fetchProfilesBy, publicMediaUrl, searchProfiles, searchTerm, type Profile } from "@/lib/profiles";

export type VideoCreator = {
  username: string;
  name: string;
  avatar: string | null;
  evmWallet: string | null;
};

export type Video = {
  id: string;
  title: string;
  description: string;
  hashtags: string[];
  src: string | null;
  /** Still image for grids. Mux posts have one; storage uploads use the first frame instead. */
  poster: string | null;
  /** "live" while broadcasting, "replay" once the broadcast ended, null for uploads. */
  live: "live" | "replay" | null;
  watch: string;
  comments: string;
  createdAt: string;
  creator: VideoCreator;
};

export type CreatorSummary = VideoCreator & { videos: number };

export type PostRow = {
  id: string;
  privy_id: string;
  username: string;
  caption: string | null;
  hashtags: string[] | null;
  watch: string;
  comments: string;
  video_path: string | null;
  created_at: string;
  kind?: "video" | "live";
  live_status?: "waiting" | "active" | "ended" | null;
  mux_playback_id?: string | null;
  mux_recording_id?: string | null;
};

const baseColumns = "id, privy_id, username, caption, hashtags, watch, comments, video_path, created_at";
const liveColumns = `${baseColumns}, kind, live_status, mux_playback_id, mux_recording_id`;
/** Uploads, broadcasts on air, and broadcasts with a recording. Sessions still waiting for video stay hidden. */
const onTimeline = "kind.eq.video,live_status.eq.active,mux_recording_id.not.is.null";
const publicWatch = "Everyone";

let liveSchema = true;

type PostQuery = PromiseLike<{ data: unknown; error: { message: string } | null }>;

/** Runs a posts query with the live columns, falling back to uploads only until supabase/schema.sql is re-run. */
export async function queryPosts(build: (columns: string, live: boolean) => PostQuery): Promise<PostRow[] | null> {
  if (liveSchema) {
    const { data, error } = await build(liveColumns, true);
    if (!error) return (data as PostRow[] | null) ?? [];
    if (!/kind|live_status|mux_/.test(error.message)) return null;
    liveSchema = false;
  }
  const { data, error } = await build(baseColumns, false);
  return error ? null : ((data as PostRow[] | null) ?? []);
}

export function streamUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function streamPoster(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.webp?width=720`;
}

export function mediaFor(row: PostRow): Pick<Video, "src" | "poster" | "live"> {
  if (row.kind === "live") {
    const live = row.live_status === "active";
    const playbackId = live ? row.mux_playback_id : row.mux_recording_id;
    return {
      src: playbackId ? streamUrl(playbackId) : null,
      poster: playbackId ? streamPoster(playbackId) : null,
      live: live ? "live" : "replay",
    };
  }
  return { src: publicMediaUrl("videos", row.video_path), poster: null, live: null };
}

function liveFirst(videos: Video[]) {
  return [...videos.filter((video) => video.live === "live"), ...videos.filter((video) => video.live !== "live")];
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVideoId(value: string) {
  return uuidPattern.test(value);
}

function creatorFrom(row: PostRow, profile: Profile | undefined): VideoCreator {
  return {
    username: profile?.username ?? row.username,
    name: profile ? channelName(profile) : row.username,
    avatar: profile ? publicMediaUrl("images", profile.avatar_path) : null,
    evmWallet: profile?.evm_wallet ?? null,
  };
}

async function withCreators(rows: PostRow[]): Promise<Video[]> {
  const ids = Array.from(new Set(rows.map((row) => row.privy_id)));
  const profiles = await fetchProfilesBy("privy_id", ids);
  const byId = new Map(profiles.map((profile) => [profile.privy_id, profile]));
  return rows.map((row) => {
    const [title, ...rest] = (row.caption ?? "").split("\n\n");
    return {
      id: row.id,
      title: title?.trim() || "Untitled",
      description: rest.join("\n\n").trim(),
      hashtags: row.hashtags ?? [],
      ...mediaFor(row),
      watch: row.watch,
      comments: row.comments,
      createdAt: row.created_at,
      creator: creatorFrom(row, byId.get(row.privy_id)),
    };
  });
}

export async function fetchFeed(limit = 30): Promise<Video[]> {
  if (!supabaseEnv()) return [];
  const rows = await queryPosts((columns, live) => {
    const query = createClient().from("posts").select(columns).eq("watch", publicWatch);
    return (live ? query.or(onTimeline) : query).order("created_at", { ascending: false }).limit(limit);
  });
  return rows ? liveFirst(await withCreators(rows)) : [];
}

/** Unlisted videos open by link; private ones only for the owner. */
export async function fetchVideo(id: string, viewerPrivyId?: string | null): Promise<Video | null> {
  if (!isVideoId(id) || !supabaseEnv()) return null;
  const rows = await queryPosts((columns) => createClient().from("posts").select(columns).eq("id", id).limit(1));
  const row = rows?.[0];
  if (!row) return null;
  if (row.watch === "Only you" && row.privy_id !== viewerPrivyId) return null;
  const [video] = await withCreators([row]);
  return video ?? null;
}

export async function fetchCreatorVideos(username: string, limit = 12): Promise<Video[]> {
  if (!supabaseEnv()) return [];
  const rows = await queryPosts((columns, live) => {
    const query = createClient().from("posts").select(columns).eq("username", username).eq("watch", publicWatch);
    return (live ? query.or(onTimeline) : query).order("created_at", { ascending: false }).limit(limit);
  });
  return rows ? liveFirst(await withCreators(rows)) : [];
}

/** Every post on a channel, including unlisted and private ones; the channel page filters by viewer. */
export async function fetchChannelVideos(username: string): Promise<Video[]> {
  if (!supabaseEnv()) return [];
  const rows = await queryPosts((columns, live) => {
    const query = createClient().from("posts").select(columns).eq("username", username);
    return (live ? query.or(onTimeline) : query).order("created_at", { ascending: false });
  });
  return rows ? liveFirst(await withCreators(rows)) : [];
}

export async function searchVideos(query: string, limit = 60): Promise<Video[]> {
  const term = searchTerm(query);
  if (!term) return fetchFeed(limit);
  if (!supabaseEnv()) return [];
  const tag = term.replace(/\s/g, "");
  const rows = await queryPosts((columns, live) => {
    const base = createClient()
      .from("posts")
      .select(columns)
      .eq("watch", publicWatch)
      .or(`caption.ilike.%${term}%,username.ilike.%${term}%,hashtags.cs.{${tag}}`);
    return (live ? base.or(onTimeline) : base).order("created_at", { ascending: false }).limit(limit);
  });
  return rows ? liveFirst(await withCreators(rows)) : [];
}

export async function fetchCreators(query = "", limit = 24): Promise<CreatorSummary[]> {
  if (!supabaseEnv()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("privy_id")
    .eq("watch", publicWatch)
    .order("created_at", { ascending: false })
    .limit(1000);
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { privy_id: string }[]) counts.set(row.privy_id, (counts.get(row.privy_id) ?? 0) + 1);

  const profiles = searchTerm(query)
    ? await searchProfiles(query, limit)
    : await fetchProfilesBy("privy_id", Array.from(counts.keys()).slice(0, limit));
  return profiles
    .map((profile) => ({
      username: profile.username,
      name: channelName(profile),
      avatar: publicMediaUrl("images", profile.avatar_path),
      evmWallet: profile.evm_wallet,
      videos: counts.get(profile.privy_id) ?? 0,
    }))
    .sort((a, b) => b.videos - a.videos)
    .slice(0, limit);
}

export function timeAgo(iso: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const steps: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [604800, "w"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [size, unit] of steps) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${unit} ago`;
  }
  return "just now";
}

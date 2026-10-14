import { createClient } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";
import { fetchProfilesBy, publicMediaUrl } from "@/lib/profiles";

export type VideoComment = {
  id: string;
  video_key: string;
  username: string;
  avatar: string | null;
  body: string;
  created_at: string;
};

export type VideoStats = {
  comments: number;
  likes: number;
  liked: boolean;
};

export async function fetchVideoStats(videoKey: string, privyId: string | null): Promise<VideoStats> {
  const empty = { comments: 0, likes: 0, liked: false };
  if (!supabaseEnv()) return empty;
  const supabase = createClient();
  const [comments, likes, mine] = await Promise.all([
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("video_key", videoKey),
    supabase.from("video_likes").select("privy_id", { count: "exact", head: true }).eq("video_key", videoKey),
    privyId
      ? supabase.from("video_likes").select("privy_id").eq("video_key", videoKey).eq("privy_id", privyId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (comments.error || likes.error || mine.error) return empty;
  return {
    comments: comments.count ?? 0,
    likes: likes.count ?? 0,
    liked: Boolean(mine.data),
  };
}

export async function fetchComments(videoKey: string) {
  if (!supabaseEnv()) return { comments: [] as VideoComment[], error: "Add the Supabase URL and key to .env.local to load comments." };
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, video_key, privy_id, username, body, created_at")
    .eq("video_key", videoKey)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { comments: [] as VideoComment[], error: "Could not load comments." };
  const rows = (data ?? []) as (Omit<VideoComment, "avatar"> & { privy_id: string })[];
  const profiles = await fetchProfilesBy("privy_id", Array.from(new Set(rows.map((row) => row.privy_id))));
  const byId = new Map(profiles.map((profile) => [profile.privy_id, profile]));
  return {
    comments: rows.map((row) => {
      const profile = byId.get(row.privy_id);
      return {
        id: row.id,
        video_key: row.video_key,
        username: profile?.username ?? row.username,
        avatar: profile ? publicMediaUrl("images", profile.avatar_path) : null,
        body: row.body,
        created_at: row.created_at,
      };
    }),
    error: null,
  };
}

export async function postComment(input: { videoKey: string; privyId: string; username: string; body: string }) {
  const body = input.body.trim();
  if (!body) return "Write a comment before posting.";
  if (body.length > 500) return "Keep the comment under 500 characters.";
  if (!supabaseEnv()) return "Add the Supabase URL and key to .env.local to post a comment.";
  const supabase = createClient();
  const { error } = await supabase.from("comments").insert({
    video_key: input.videoKey,
    privy_id: input.privyId,
    username: input.username,
    body,
  });
  if (error) return "Could not post that comment.";
  return null;
}

export async function setVideoLike(videoKey: string, privyId: string, liked: boolean) {
  if (!supabaseEnv()) return "Add the Supabase URL and key to .env.local to save a like.";
  const supabase = createClient();
  if (liked) {
    const { error } = await supabase.from("video_likes").insert({ video_key: videoKey, privy_id: privyId });
    if (error && error.code !== "23505") return "Could not save that like.";
    return null;
  }
  const { error } = await supabase.from("video_likes").delete().eq("video_key", videoKey).eq("privy_id", privyId);
  if (error) return "Could not save that like.";
  return null;
}

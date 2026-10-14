import { createClient } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";

export type FollowState = { followers: number; following: boolean };

export async function fetchFollowState(creatorId: string, viewerId: string | null): Promise<FollowState | null> {
  if (!supabaseEnv()) return null;
  const supabase = createClient();
  const [followers, mine] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", creatorId),
    viewerId
      ? supabase.from("follows").select("follower_id").eq("following_id", creatorId).eq("follower_id", viewerId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (followers.error || mine.error) return null;
  return { followers: followers.count ?? 0, following: Boolean(mine.data) };
}

export async function setFollow(followerId: string, followingId: string, follow: boolean) {
  if (followerId === followingId) return "You can't follow yourself.";
  if (!supabaseEnv()) return "Add the Supabase URL and key to .env.local to follow someone.";
  const supabase = createClient();
  if (follow) {
    const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
    if (error && error.code !== "23505") return "Could not follow them.";
    return null;
  }
  const { error } = await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
  if (error) return "Could not unfollow them.";
  return null;
}

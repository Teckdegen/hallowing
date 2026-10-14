import { createClient } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";

const storageKey = "hallowing:viewer";

/** Logged-in people count once per account. Everyone else counts once per browser. */
export function viewerKey(privyId: string | null) {
  if (privyId) return privyId;
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;
    const next = crypto.randomUUID();
    localStorage.setItem(storageKey, next);
    return next;
  } catch {
    return null;
  }
}

export async function fetchViewCount(videoKey: string) {
  if (!supabaseEnv()) return null;
  const { count, error } = await createClient()
    .from("video_views")
    .select("viewer", { count: "exact", head: true })
    .eq("video_key", videoKey);
  if (error) return null;
  return count ?? 0;
}

/** Returns true when this person had not been counted on this haunt before. */
export async function recordView(videoKey: string, viewer: string) {
  if (!supabaseEnv()) return false;
  const { error } = await createClient().from("video_views").insert({ video_key: videoKey, viewer });
  return !error;
}

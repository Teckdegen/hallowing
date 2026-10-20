import { createClient } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";

export type PortraitGender = "male" | "female";

export const socialPlatforms = ["x", "instagram", "tiktok", "youtube", "threads"] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];
export type Socials = Partial<Record<SocialPlatform, string>>;

export type Profile = {
  privy_id: string;
  wallet: string;
  username: string;
  display_name: string | null;
  bio: string;
  website: string | null;
  avatar_path: string | null;
  banner_path: string | null;
  gender: PortraitGender | null;
  evm_wallet: string | null;
  socials: Socials;
  created_at: string | null;
};

export type PostRecord = {
  id: string;
  caption: string;
  video_path: string;
  watch: string;
  created_at: string;
};

const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
const socialPattern = /^[a-zA-Z0-9_.]{1,30}$/;
const baseColumns = "privy_id, wallet, username, display_name, bio, website, avatar_path, banner_path, gender, evm_wallet, created_at";
const socialColumns = socialPlatforms.map((platform) => `social_${platform}`).join(", ");
const columnSets = [`${baseColumns}, ${socialColumns}`, baseColumns, "privy_id, wallet, username"];

type ProfileRow = Parameters<typeof asProfile>[0];

async function selectProfile(column: "privy_id" | "username", value: string) {
  const supabase = createClient();
  for (const columns of columnSets) {
    const { data, error } = await supabase.from("profiles").select(columns).eq(column, value).maybeSingle();
    if (!error) return data ? asProfile(data as unknown as ProfileRow) : null;
  }
  return null;
}

export function cleanSocial(value: string) {
  const trimmed = value
    .trim()
    .replace(/^https?:\/\/(www\.)?[^/]+\/(@)?/i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  if (!trimmed) return "";
  return socialPattern.test(trimmed) ? trimmed : null;
}

export function socialUrl(platform: SocialPlatform, handle: string) {
  const urls: Record<SocialPlatform, string> = {
    x: `https://x.com/${handle}`,
    instagram: `https://instagram.com/${handle}`,
    tiktok: `https://tiktok.com/@${handle}`,
    youtube: `https://youtube.com/@${handle}`,
    threads: `https://threads.net/@${handle}`,
  };
  return urls[platform];
}

export function cleanUsername(value: string) {
  return value.trim().replace(/^@/, "");
}

export function channelName(profile: Pick<Profile, "display_name" | "username">) {
  const name = profile.display_name?.trim();
  return name || profile.username;
}

export function publicMediaUrl(bucket: "images" | "videos", path: string | null) {
  if (!path || !supabaseEnv()) return null;
  const supabase = createClient();
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function asProfile(row: {
  privy_id: string;
  wallet: string;
  username: string;
  display_name?: string | null;
  bio?: string | null;
  website?: string | null;
  avatar_path?: string | null;
  banner_path?: string | null;
  gender?: string | null;
  evm_wallet?: string | null;
  created_at?: string | null;
  social_x?: string | null;
  social_instagram?: string | null;
  social_tiktok?: string | null;
  social_youtube?: string | null;
  social_threads?: string | null;
}): Profile {
  const socials: Socials = {};
  for (const platform of socialPlatforms) {
    const handle = row[`social_${platform}`];
    if (handle) socials[platform] = handle;
  }
  return {
    socials,
    privy_id: row.privy_id,
    wallet: row.wallet,
    username: row.username,
    display_name: row.display_name ?? null,
    bio: row.bio ?? "",
    website: row.website ?? null,
    avatar_path: row.avatar_path ?? null,
    banner_path: row.banner_path ?? null,
    gender: row.gender === "male" || row.gender === "female" ? row.gender : null,
    evm_wallet: row.evm_wallet ?? null,
    created_at: row.created_at ?? null,
  };
}

export async function fetchProfile(privyId: string) {
  if (!supabaseEnv()) return null;
  return selectProfile("privy_id", privyId);
}

export async function fetchProfileByUsername(username: string) {
  if (!supabaseEnv()) return null;
  return selectProfile("username", username);
}

export async function fetchProfilesBy(column: "wallet" | "evm_wallet" | "privy_id" | "username", values: string[]) {
  if (!values.length || !supabaseEnv()) return [];
  const supabase = createClient();
  for (const columns of columnSets) {
    const { data, error } = await supabase.from("profiles").select(columns).in(column, values);
    if (!error) return ((data ?? []) as unknown as ProfileRow[]).map((row) => asProfile(row));
  }
  return [];
}

export function fetchProfilesByWallets(wallets: string[]) {
  return fetchProfilesBy("wallet", wallets);
}

export function fetchProfilesByIds(ids: string[]) {
  return fetchProfilesBy("privy_id", ids);
}

export async function searchProfiles(query: string, limit = 12) {
  const term = searchTerm(query);
  if (!term || !supabaseEnv()) return [];
  const supabase = createClient();
  for (const columns of columnSets.slice(0, 2)) {
    const { data, error } = await supabase
      .from("profiles")
      .select(columns)
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .limit(limit);
    if (!error) return ((data ?? []) as unknown as ProfileRow[]).map((row) => asProfile(row));
  }
  return [];
}

/** PostgREST `or` filters treat commas, parentheses and wildcards as syntax. */
export function searchTerm(query: string) {
  return query
    .trim()
    .replace(/^[@#]/, "")
    .replace(/[,()%*\\:"']/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 60)
    .trim();
}

export async function saveEvmWallet(privyId: string, evmWallet: string) {
  if (!supabaseEnv()) return { error: "Add the Supabase URL and key to .env.local to store this account." };
  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ evm_wallet: evmWallet }).eq("privy_id", privyId);
  if (error) return { error: "Could not save that wallet." };
  return { error: null };
}

export async function fetchPosts(username: string) {
  if (!supabaseEnv()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, caption, video_path, watch, created_at")
    .eq("username", username)
    .order("created_at", { ascending: false });
  return (data as PostRecord[] | null) ?? [];
}

export async function saveProfile(input: { privyId: string; wallet: string; username: string }) {
  const username = cleanUsername(input.username);
  if (!usernamePattern.test(username)) {
    return { profile: null, error: "Use 3–20 letters, numbers, or underscores." };
  }
  if (!supabaseEnv()) {
    return { profile: null, error: "Add the Supabase URL and key to .env.local to store this account." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("profiles").upsert({
    privy_id: input.privyId,
    wallet: input.wallet,
    username,
  });

  if (error) {
    if (error.code === "23505") return { profile: null, error: "That username is taken." };
    return { profile: null, error: "Could not save that username." };
  }
  const profile = await fetchProfile(input.privyId);
  if (!profile) return { profile: null, error: "Could not save that username." };
  return { profile, error: null };
}

export function cleanWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function saveChannel(input: {
  privyId: string;
  displayName: string;
  bio: string;
  website: string;
  socials: Record<SocialPlatform, string>;
  avatar: File | null;
  banner: File | null;
}) {
  const socials: Record<string, string | null> = {};
  for (const platform of socialPlatforms) {
    const handle = cleanSocial(input.socials[platform] ?? "");
    if (handle === null) return { profile: null, error: "Use letters, numbers, dots, or underscores for usernames." };
    socials[`social_${platform}`] = handle || null;
  }
  const displayName = input.displayName.trim();
  const bio = input.bio.trim();
  if (!displayName || displayName.length > 50) {
    return { profile: null, error: "Use a name of 1–50 characters." };
  }
  if (bio.length > 1000) {
    return { profile: null, error: "Keep the bio under 1000 characters." };
  }
  const website = cleanWebsite(input.website);
  if (website === null) return { profile: null, error: "Enter a valid website." };
  if (!supabaseEnv()) {
    return { profile: null, error: "Add the Supabase URL and key to .env.local to store this channel." };
  }

  const avatar = input.avatar ? await uploadImage(input.privyId, "avatar", input.avatar) : { path: null, error: null };
  if (avatar.error) return { profile: null, error: avatar.error };
  const banner = input.banner ? await uploadImage(input.privyId, "banner", input.banner) : { path: null, error: null };
  if (banner.error) return { profile: null, error: banner.error };

  const patch: {
    display_name: string;
    bio: string;
    website: string | null;
    avatar_path?: string;
    banner_path?: string;
  } = {
    display_name: displayName,
    bio,
    website: website || null,
  };
  if (avatar.path) patch.avatar_path = avatar.path;
  if (banner.path) patch.banner_path = banner.path;

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...patch, ...socials })
    .eq("privy_id", input.privyId);
  if (error) return { profile: null, error: "Could not save your profile." };

  const profile = await fetchProfile(input.privyId);
  if (!profile) return { profile: null, error: "Could not save your profile." };
  return { profile, error: null };
}

async function uploadImage(privyId: string, kind: "avatar" | "banner", file: File) {
  if (!file.type.startsWith("image/")) return { path: null, error: "Choose an image." };
  if (file.size > 5 * 1024 * 1024) return { path: null, error: "Use an image under 5 MB." };
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${privyId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const uploaded = await supabase.storage.from("images").upload(path, file, {
    contentType: file.type || "image/jpeg",
  });
  if (uploaded.error) return { path: null, error: "Could not upload that image." };
  return { path, error: null };
}

export type PostInput = {
  privyId: string;
  wallet: string;
  username: string;
  caption: string;
  hashtags: string[];
  tagged: string[];
  watch: string;
  comments: string;
  duet: string;
  stitch: string;
  video: File;
};

export async function savePost(input: PostInput): Promise<{ id: string | null; error: string | null }> {
  if (!supabaseEnv()) return { id: null, error: "Add the Supabase URL and key to .env.local to publish." };

  const supabase = createClient();
  const ext = input.video.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${input.privyId}/${crypto.randomUUID()}.${ext}`;
  const uploaded = await supabase.storage.from("videos").upload(path, input.video, {
    contentType: input.video.type || "video/mp4",
  });
  if (uploaded.error) return { id: null, error: "Could not upload that video." };

  const { data, error } = await supabase
    .from("posts")
    .insert({
    privy_id: input.privyId,
    wallet: input.wallet,
    username: input.username,
    caption: input.caption.trim(),
    hashtags: input.hashtags,
    tagged: input.tagged,
    watch: input.watch,
    comments: input.comments,
    duet: input.duet,
    stitch: input.stitch,
    video_path: path,
    })
    .select("id")
    .single();

  if (error || !data) return { id: null, error: "Could not post that video." };
  return { id: (data as { id: string }).id, error: null };
}

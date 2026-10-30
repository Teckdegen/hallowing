// Seeds labeled "Hallowing Picks" house accounts with free-license Pexels clips.
// House accounts have no EVM wallet, so they can't receive gifts or rank on the leaderboard.
// Run: node scripts/seed-picks.mjs   (safe to re-run; existing clips are skipped)
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function loadEnv() {
  const text = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
  }
  return env;
}

const env = loadEnv();
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new Error("Missing Supabase env");
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
  global: { headers: { "User-Agent": "hallowing-admin/1.0" } },
});

const houseBio = "Free stock clips picked by the Hallowing team. A house account, so it can't receive gifts or rank on the board.";

const accounts = [
  { username: "picks_costumes", display_name: "Hallowing Picks · Costumes" },
  { username: "picks_treats", display_name: "Hallowing Picks · Trick or Treat" },
  { username: "picks_frights", display_name: "Hallowing Picks · Frights" },
];

const clips = [
  { account: "picks_costumes", id: 7516660, by: "RDNE Stock project", title: "Pumpkin patrol", line: "Took the costume very seriously. Did not take the job seriously.", tags: ["halloween", "costume", "dog"] },
  { account: "picks_costumes", id: 9149219, by: "Mikhail Nilov", title: "Tiny devil, big moves", line: "The horns stayed on the whole routine.", tags: ["halloween", "costume", "dance"] },
  { account: "picks_costumes", id: 34630353, by: "Pimon Kumsri", title: "Skeleton crew", line: "No muscles, all rhythm.", tags: ["halloween", "skeleton", "dance"] },
  { account: "picks_treats", id: 5856462, by: "Charles Parker", title: "Smallest ghost on the block", line: "Brought a flashlight. Still checked every bush twice.", tags: ["halloween", "ghost", "trickortreat"] },
  { account: "picks_treats", id: 5614411, by: "Yaroslav Shuraev", title: "First house of the night", line: "The candy bowl was the real boss fight.", tags: ["halloween", "trickortreat", "candy"] },
  { account: "picks_treats", id: 5856447, by: "Charles Parker", title: "Knock knock", line: "Two witches, one door, zero patience.", tags: ["halloween", "trickortreat", "witch"] },
  { account: "picks_frights", id: 5435717, by: "cottonbro studio", title: "Hallway rush hour", line: "You only need to be faster than whoever is behind you.", tags: ["halloween", "zombie", "haunt"] },
  { account: "picks_frights", id: 5435724, by: "cottonbro studio", title: "Undead, unbothered", line: "Rose from the grave just to dance.", tags: ["halloween", "zombie", "dance"] },
];

const cacheDir = path.join(process.cwd(), ".tmp-shots", "picks");
fs.mkdirSync(cacheDir, { recursive: true });

async function download(id) {
  const file = path.join(cacheDir, `${id}.mp4`);
  if (fs.existsSync(file)) return fs.readFileSync(file);
  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
  let bytes;
  for (let attempt = 1; !bytes; attempt += 1) {
    try {
      const res = await fetch(`https://www.pexels.com/download/video/${id}/`, { headers: { "User-Agent": ua } });
      if (!res.ok) throw new Error(`download ${id}: ${res.status}`);
      bytes = Buffer.from(await res.arrayBuffer());
    } catch (error) {
      if (attempt >= 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
  if (bytes.length > maxUploadBytes) {
    const raw = path.join(cacheDir, `${id}-raw.mp4`);
    fs.writeFileSync(raw, bytes);
    await shrink(raw, file);
    fs.unlinkSync(raw);
    return fs.readFileSync(file);
  }
  fs.writeFileSync(file, bytes);
  return bytes;
}

/** Supabase storage rejects objects over 50 MB, so big clips are re-encoded to 720p. Needs `npm i --no-save ffmpeg-static`. */
const maxUploadBytes = 45 * 1024 * 1024;

async function shrink(input, output) {
  const ffmpeg = (await import("ffmpeg-static")).default;
  const { execFileSync } = await import("child_process");
  execFileSync(ffmpeg, [
    "-y", "-i", input,
    "-vf", "scale='if(gt(iw,ih),1280,720)':-2",
    "-c:v", "libx264", "-preset", "medium", "-crf", "26",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    output,
  ], { stdio: "ignore" });
}

for (const account of accounts) {
  const { error } = await supabase.from("profiles").upsert(
    { privy_id: `house:${account.username}`, wallet: "", username: account.username, display_name: account.display_name, bio: houseBio },
    { onConflict: "privy_id" },
  );
  if (error) throw new Error(`profile ${account.username}: ${error.message}`);
}

for (const clip of clips) {
  const privyId = `house:${clip.account}`;
  const caption = `${clip.title}\n\n${clip.line}\n\nFree clip by ${clip.by} on Pexels.`;
  const { data: existing } = await supabase.from("posts").select("id").eq("privy_id", privyId).eq("caption", caption).limit(1);
  if (existing?.length) {
    console.log(`skip  ${clip.account}  ${clip.title}`);
    continue;
  }
  const bytes = await download(clip.id);
  const storagePath = `${privyId}/${randomUUID()}.mp4`;
  const uploaded = await supabase.storage.from("videos").upload(storagePath, bytes, { contentType: "video/mp4" });
  if (uploaded.error) throw new Error(`upload ${clip.id}: ${uploaded.error.message}`);
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      privy_id: privyId,
      wallet: "",
      username: clip.account,
      caption,
      hashtags: clip.tags,
      tagged: [],
      watch: "Everyone",
      comments: "Everyone",
      duet: "Everyone",
      stitch: "Everyone",
      video_path: storagePath,
    })
    .select("id")
    .single();
  if (error) throw new Error(`post ${clip.id}: ${error.message}`);
  console.log(`added ${clip.account}  ${clip.title}  ${(bytes.length / 1e6).toFixed(1)} MB  ${post.id}`);
}

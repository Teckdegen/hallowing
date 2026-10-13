import { endSession, ensureChannel, openSession, studioPayload, syncSession } from "@/lib/live-server";
import { muxConfigured } from "@/lib/mux";
import { privyUserId } from "@/lib/privy-server";
import { createAdminClient } from "@/lib/supabase/admin";

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

async function context(request: Request) {
  if (!muxConfigured()) return { error: fail("Live streaming needs MUX_TOKEN_ID and MUX_TOKEN_SECRET in .env.", 503) };
  const admin = createAdminClient();
  if (!admin) return { error: fail("Live streaming needs SUPABASE_SECRET_KEY in .env.", 503) };
  const privyId = await privyUserId(request);
  if (!privyId) return { error: fail("Log in to go live.", 401) };
  return { admin, privyId };
}

/** The creator's open broadcast, refreshed from Mux, with the ingest details. */
export async function GET(request: Request) {
  const ctx = await context(request);
  if ("error" in ctx) return ctx.error;
  try {
    const open = await openSession(ctx.admin, ctx.privyId);
    if (!open) return Response.json({ session: null });
    const session = await syncSession(ctx.admin, open);
    const channel = await ensureChannel(ctx.admin, ctx.privyId);
    return Response.json(studioPayload(session, channel));
  } catch {
    return fail("Could not reach Mux. Try again in a moment.", 502);
  }
}

/** Starts a broadcast: creates the creator's Mux stream on first use and a live post for this session. */
export async function POST(request: Request) {
  const ctx = await context(request);
  if ("error" in ctx) return ctx.error;
  const body = (await request.json().catch(() => ({}))) as { title?: unknown; hashtags?: unknown };
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) : "";
  if (!title) return fail("Give your stream a title.", 400);
  const hashtags = Array.isArray(body.hashtags)
    ? body.hashtags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean).slice(0, 10)
    : [];

  const { data: profile } = await ctx.admin.from("profiles").select("privy_id, wallet, username").eq("privy_id", ctx.privyId).maybeSingle();
  if (!profile) return fail("Pick a username before going live.", 403);

  try {
    const channel = await ensureChannel(ctx.admin, ctx.privyId);
    const existing = await openSession(ctx.admin, ctx.privyId);
    if (existing) return Response.json(studioPayload(existing, channel));

    const { data, error } = await ctx.admin
      .from("posts")
      .insert({
        privy_id: profile.privy_id,
        wallet: profile.wallet,
        username: profile.username,
        caption: title,
        hashtags,
        tagged: [],
        watch: "Everyone",
        comments: "Everyone",
        duet: "Everyone",
        stitch: "Everyone",
        video_path: null,
        kind: "live",
        live_status: "waiting",
        mux_live_stream_id: channel.mux_live_stream_id,
        mux_playback_id: channel.mux_playback_id,
      })
      .select("id, privy_id, caption, live_status, mux_live_stream_id, mux_playback_id, mux_asset_id, mux_recording_id, created_at")
      .single();
    if (error || !data) return fail("Could not start your stream.", 500);
    return Response.json(studioPayload(data, channel));
  } catch {
    return fail("Could not reach Mux. Try again in a moment.", 502);
  }
}

/** Ends the open broadcast. The recording stays on the creator's channel and the feed. */
export async function DELETE(request: Request) {
  const ctx = await context(request);
  if ("error" in ctx) return ctx.error;
  const open = await openSession(ctx.admin, ctx.privyId);
  if (!open) return Response.json({ ended: null });
  const ended = await endSession(ctx.admin, open);
  return Response.json({ ended: ended ? { id: ended.id, recorded: Boolean(ended.mux_recording_id) } : null });
}

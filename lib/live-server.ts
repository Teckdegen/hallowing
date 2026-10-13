import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { completeLiveStream, createLiveStream, getAsset, getLiveStream, muxIngestUrl, publicPlaybackId } from "@/lib/mux";

export type LiveSessionRow = {
  id: string;
  privy_id: string;
  caption: string;
  live_status: "waiting" | "active" | "ended";
  mux_live_stream_id: string;
  mux_playback_id: string;
  mux_asset_id: string | null;
  mux_recording_id: string | null;
  created_at: string;
};

type Channel = { privy_id: string; mux_live_stream_id: string; mux_playback_id: string; stream_key: string };

const sessionColumns = "id, privy_id, caption, live_status, mux_live_stream_id, mux_playback_id, mux_asset_id, mux_recording_id, created_at";

export async function ensureChannel(admin: SupabaseClient, privyId: string): Promise<Channel> {
  const { data } = await admin.from("live_channels").select("*").eq("privy_id", privyId).maybeSingle();
  if (data) return data as Channel;
  const stream = await createLiveStream();
  const playbackId = publicPlaybackId(stream);
  if (!playbackId) throw new Error("Mux returned a live stream without a public playback id");
  const channel = { privy_id: privyId, mux_live_stream_id: stream.id, mux_playback_id: playbackId, stream_key: stream.stream_key };
  const { error } = await admin.from("live_channels").insert(channel);
  if (error) throw error;
  return channel;
}

export async function openSession(admin: SupabaseClient, privyId: string) {
  const { data } = await admin
    .from("posts")
    .select(sessionColumns)
    .eq("privy_id", privyId)
    .eq("kind", "live")
    .in("live_status", ["waiting", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as LiveSessionRow | null) ?? null;
}

export function studioPayload(session: LiveSessionRow, channel: Channel) {
  return {
    session: { id: session.id, title: session.caption.split("\n\n")[0], status: session.live_status, playbackId: session.mux_playback_id },
    ingest: { url: muxIngestUrl, streamKey: channel.stream_key },
  };
}

async function recordingFor(assetId: string) {
  try {
    return publicPlaybackId(await getAsset(assetId));
  } catch {
    return null;
  }
}

/**
 * Moves the newest open session for a Mux live stream to match Mux:
 * active once video arrives, ended once the stream goes idle after being active.
 */
export async function applyStreamState(admin: SupabaseClient, liveStreamId: string, status: string, activeAssetId?: string | null) {
  const { data } = await admin
    .from("posts")
    .select(sessionColumns)
    .eq("mux_live_stream_id", liveStreamId)
    .eq("kind", "live")
    .in("live_status", ["waiting", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const session = data as LiveSessionRow | null;
  if (!session) return null;

  if (status === "active" && session.live_status === "waiting") {
    const assetId = activeAssetId ?? null;
    const patch = { live_status: "active", mux_asset_id: assetId, mux_recording_id: assetId ? await recordingFor(assetId) : null };
    await admin.from("posts").update(patch).eq("id", session.id);
    return { ...session, ...patch } as LiveSessionRow;
  }

  if (status === "idle" && session.live_status === "active") {
    const recording = session.mux_recording_id ?? (session.mux_asset_id ? await recordingFor(session.mux_asset_id) : null);
    const patch = { live_status: "ended", mux_recording_id: recording };
    await admin.from("posts").update(patch).eq("id", session.id);
    return { ...session, ...patch } as LiveSessionRow;
  }

  return session;
}

/** Asks Mux for the stream's state. Used by the studio so status works without webhooks too. */
export async function syncSession(admin: SupabaseClient, session: LiveSessionRow) {
  const stream = await getLiveStream(session.mux_live_stream_id);
  return (await applyStreamState(admin, stream.id, stream.status, stream.active_asset_id)) ?? session;
}

/** Ends the broadcast. A session that never received video is removed instead of left empty on the timeline. */
export async function endSession(admin: SupabaseClient, session: LiveSessionRow) {
  if (session.live_status === "waiting") {
    await admin.from("posts").delete().eq("id", session.id);
    return null;
  }
  try {
    await completeLiveStream(session.mux_live_stream_id);
  } catch {}
  const recording = session.mux_recording_id ?? (session.mux_asset_id ? await recordingFor(session.mux_asset_id) : null);
  const patch = { live_status: "ended", mux_recording_id: recording };
  await admin.from("posts").update(patch).eq("id", session.id);
  return { ...session, ...patch } as LiveSessionRow;
}

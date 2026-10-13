import { applyStreamState } from "@/lib/live-server";
import { publicPlaybackId, verifyMuxSignature } from "@/lib/mux";
import { createAdminClient } from "@/lib/supabase/admin";

type MuxEvent = {
  type: string;
  data: {
    id: string;
    status?: string;
    active_asset_id?: string;
    live_stream_id?: string;
    playback_ids?: { id: string; policy: string }[];
  };
};

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "MUX_WEBHOOK_SECRET is not set" }, { status: 503 });
  if (!verifyMuxSignature(raw, request.headers.get("mux-signature"), secret)) {
    return Response.json({ error: "Bad signature" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "SUPABASE_SECRET_KEY is not set" }, { status: 503 });

  const event = JSON.parse(raw) as MuxEvent;
  switch (event.type) {
    case "video.live_stream.active":
      await applyStreamState(admin, event.data.id, "active", event.data.active_asset_id);
      break;
    case "video.live_stream.idle":
      await applyStreamState(admin, event.data.id, "idle");
      break;
    case "video.asset.live_stream_completed": {
      const recording = publicPlaybackId(event.data);
      if (recording) {
        await admin
          .from("posts")
          .update({ live_status: "ended", mux_recording_id: recording })
          .eq("mux_asset_id", event.data.id)
          .eq("kind", "live");
      }
      break;
    }
  }
  return Response.json({ received: true });
}

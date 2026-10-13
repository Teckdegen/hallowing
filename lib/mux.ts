import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const api = "https://api.mux.com/video/v1";

export const muxIngestUrl = "rtmps://global-live.mux.com:443/app";

export type MuxLiveStream = {
  id: string;
  stream_key: string;
  status: "idle" | "active" | "disabled";
  active_asset_id?: string;
  recent_asset_ids?: string[];
  playback_ids?: { id: string; policy: string }[];
};

export type MuxAsset = {
  id: string;
  status: "preparing" | "ready" | "errored";
  live_stream_id?: string;
  playback_ids?: { id: string; policy: string }[];
};

export function muxConfigured() {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

async function mux<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString("base64");
  const response = await fetch(`${api}${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Mux ${init?.method ?? "GET"} ${path} failed with ${response.status}`);
  const body = (await response.json().catch(() => ({}))) as { data: T };
  return body.data;
}

/** A reusable stream: the same key works for every broadcast, and each broadcast records its own asset. */
export function createLiveStream() {
  return mux<MuxLiveStream>("/live-streams", {
    method: "POST",
    body: JSON.stringify({
      playback_policies: ["public"],
      new_asset_settings: { playback_policies: ["public"] },
      latency_mode: "low",
      reconnect_window: 60,
    }),
  });
}

export function getLiveStream(id: string) {
  return mux<MuxLiveStream>(`/live-streams/${id}`);
}

export function getAsset(id: string) {
  return mux<MuxAsset>(`/assets/${id}`);
}

/** Ends the broadcast right away instead of waiting out the reconnect window. */
export async function completeLiveStream(id: string) {
  await mux<unknown>(`/live-streams/${id}/complete`, { method: "PUT" });
}

export function publicPlaybackId(item: { playback_ids?: { id: string; policy: string }[] }) {
  return item.playback_ids?.find((playback) => playback.policy === "public")?.id ?? null;
}

/** Checks the `mux-signature` header (t=<unix>,v1=<hmac sha256 of "t.body">). */
export function verifyMuxSignature(rawBody: string, header: string | null, secret: string, toleranceSeconds = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=") as [string, string]));
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

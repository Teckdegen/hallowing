export type StudioSession = {
  id: string;
  title: string;
  status: "waiting" | "active" | "ended";
  playbackId: string;
};

export type StudioState = {
  session: StudioSession | null;
  ingest?: { url: string; streamKey: string };
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

async function call<T>(token: string | null, init?: RequestInit): Promise<Result<T>> {
  if (!token) return { ok: false, error: "Log in to go live.", status: 401 };
  try {
    const response = await fetch("/api/live", {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) return { ok: false, error: body.error ?? "Something went wrong. Try again.", status: response.status };
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: "Could not reach Hallowing. Check your connection.", status: 0 };
  }
}

export function fetchStudio(token: string | null) {
  return call<StudioState>(token);
}

export function startStream(token: string | null, input: { title: string; hashtags: string[] }) {
  return call<StudioState>(token, { method: "POST", body: JSON.stringify(input) });
}

export function endStream(token: string | null) {
  return call<{ ended: { id: string; recorded: boolean } | null }>(token, { method: "DELETE" });
}

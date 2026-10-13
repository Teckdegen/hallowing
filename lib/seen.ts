const storageKey = "hallowing:seen";
const maxEntries = 1000;

type SeenMap = Record<string, number>;

function read(): SeenMap {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

/** Remembers a watched video on this device. Oldest entries drop off past the cap. */
export function markSeen(videoId: string) {
  try {
    const seen = read();
    seen[videoId] = Date.now();
    const ids = Object.keys(seen);
    if (ids.length > maxEntries) {
      ids
        .sort((a, b) => seen[a] - seen[b])
        .slice(0, ids.length - maxEntries)
        .forEach((id) => delete seen[id]);
    }
    localStorage.setItem(storageKey, JSON.stringify(seen));
  } catch {}
}

/** Unseen videos keep their order up front; seen ones follow, least recently seen first. */
export function unseenFirst<T extends { id: string }>(videos: T[]): T[] {
  const seen = read();
  const fresh = videos.filter((video) => !seen[video.id]);
  const watched = videos.filter((video) => seen[video.id]).sort((a, b) => seen[a.id] - seen[b.id]);
  return [...fresh, ...watched];
}

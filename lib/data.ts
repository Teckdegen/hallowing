export type SceneId =
  | "manor"
  | "arcade"
  | "gate"
  | "archive"
  | "set"
  | "street"
  | "static"
  | "screen"
  | "workshop"
  | "mic"
  | "file"
  | "hospital"
  | "prep";

export const categories = [
  "Paranormal",
  "Halloween IRL",
  "Haunted Places",
  "Horror Gaming",
  "Horror Movies",
  "Cosplay",
  "Mystery",
  "Halloween Comedy",
  "Halloween Creative",
] as const;

export type CategoryName = (typeof categories)[number];

export type Creator = {
  handle: string;
  name: string;
  tagline: string;
  about: string;
  followers: number;
  support: number;
  scene: SceneId;
};

export type Stream = {
  slug: string;
  title: string;
  handle: string;
  category: CategoryName;
  scene: SceneId;
  live: boolean;
  viewers: number;
  tags: string[];
  about: string;
  duration?: string;
};

export type ChatLine = {
  user: string;
  text: string;
  ago: string;
  badge?: string;
  tone?: "orange" | "green" | "blue" | "muted";
  likes?: number;
  card?: {
    title: string;
    meta: string;
    change: string;
    detail: string;
  };
};

export const creators: Creator[] = [
  {
    handle: "nightmarehouse",
    name: "NightmareHouse",
    tagline: "Haunted house creator",
    about:
      "Overnight stays in houses people already avoid. We lock the door, kill the lights, and stay until morning.",
    followers: 24800,
    support: 182421,
    scene: "manor",
  },
  {
    handle: "ghostcam",
    name: "GhostCam",
    tagline: "Field recordings after dark",
    about:
      "One camera, quiet roads, and the places people stop visiting once October starts.",
    followers: 19120,
    support: 164820,
    scene: "gate",
  },
  {
    handle: "cryptkeeper",
    name: "CryptKeeper",
    tagline: "Archive of things left behind",
    about:
      "Reading rooms, stored objects, and files that were never meant to leave the building.",
    followers: 15440,
    support: 149204,
    scene: "archive",
  },
  {
    handle: "darkroom",
    name: "DarkRoom",
    tagline: "Sets, lights, practical effects",
    about:
      "The build before the stream. Practical lights, fog, and sets made to be walked through.",
    followers: 12110,
    support: 131892,
    scene: "set",
  },
  {
    handle: "scaresquad",
    name: "ScareSquad",
    tagline: "Neighborhood nights, in person",
    about:
      "On foot through neighborhoods that go all-in for October. No studio, no reset button.",
    followers: 9800,
    support: 118420,
    scene: "street",
  },
  {
    handle: "hollowstatic",
    name: "HollowStatic",
    tagline: "Signals, tapes, unexplained audio",
    about:
      "Tape hiss, scanner hits, and rooms that should be silent. We listen longer than is comfortable.",
    followers: 8640,
    support: 97210,
    scene: "static",
  },
  {
    handle: "marrow",
    name: "Marrow",
    tagline: "Horror films, start to finish",
    about:
      "Watchalongs with the lights off. The movie plays, and nobody talks over the good parts.",
    followers: 15220,
    support: 88440,
    scene: "screen",
  },
  {
    handle: "ashcache",
    name: "AshCache",
    tagline: "Horror games, low commentary",
    about:
      "Horror games with the HUD off and the voice kept low. The room stays dark on purpose.",
    followers: 13400,
    support: 81220,
    scene: "arcade",
  },
  {
    handle: "redporch",
    name: "RedPorch",
    tagline: "Comedy from the porch",
    about:
      "Bad costumes, worse jokes, and a porch light that stays on. October without the sermon.",
    followers: 11200,
    support: 70330,
    scene: "mic",
  },
  {
    handle: "vesper",
    name: "Vesper",
    tagline: "Costume builds",
    about:
      "Foam, paint, and the last night of a build. The costume is the stream.",
    followers: 7340,
    support: 64110,
    scene: "workshop",
  },
  {
    handle: "lowsignal",
    name: "LowSignal",
    tagline: "Mystery, slow and close",
    about:
      "One document at a time. Slow reads of cases that never officially closed.",
    followers: 6900,
    support: 55890,
    scene: "file",
  },
];

export const streams: Stream[] = [
  {
    slug: "haunted-mansion-overnight",
    title: "Haunted Mansion Overnight",
    handle: "nightmarehouse",
    category: "Haunted Places",
    scene: "manor",
    live: true,
    viewers: 2481,
    tags: ["HauntedHouse", "October"],
    about:
      "We're spending the night inside the house on Elder Street. Doors locked. Lights stay off. No one leaves until sunrise.",
  },
  {
    slug: "signal-in-the-walls",
    title: "Signal in the Walls",
    handle: "hollowstatic",
    category: "Paranormal",
    scene: "static",
    live: true,
    viewers: 1508,
    tags: ["FieldRecording", "October"],
    about:
      "A scanner, two recorders, and a room that keeps answering. We're staying on the frequency.",
  },
  {
    slug: "halloween-gaming",
    title: "Halloween Gaming",
    handle: "ashcache",
    category: "Horror Gaming",
    scene: "arcade",
    live: true,
    viewers: 1284,
    tags: ["NoHUD"],
    about:
      "A full night in one game. Voice stays low, lights stay off, and we do not skip the basement.",
  },
  {
    slug: "neighborhood-route",
    title: "Neighborhood Route",
    handle: "scaresquad",
    category: "Halloween IRL",
    scene: "street",
    live: true,
    viewers: 1102,
    tags: ["October"],
    about:
      "Walking the long way through a neighborhood that treats October like a civic duty.",
  },
  {
    slug: "the-night-shift",
    title: "The Night Shift",
    handle: "marrow",
    category: "Horror Movies",
    scene: "screen",
    live: true,
    viewers: 956,
    tags: ["Watchalong"],
    about:
      "Watchalong from the opening frame. Talk in the quiet parts, silence in the ones that matter.",
  },
  {
    slug: "cemetery-gate",
    title: "Cemetery Gate, 2am",
    handle: "ghostcam",
    category: "Paranormal",
    scene: "gate",
    live: true,
    viewers: 842,
    tags: ["October"],
    about:
      "Posted at the gate. No walkthrough, no dare. Just the camera and whatever crosses the path.",
  },
  {
    slug: "bad-costumes",
    title: "Bad Costumes, Worse Jokes",
    handle: "redporch",
    category: "Halloween Comedy",
    scene: "mic",
    live: true,
    viewers: 774,
    tags: ["Porch"],
    about:
      "A set from the porch. Costumes that do not fit, and jokes that barely do.",
  },
  {
    slug: "midnight-archive",
    title: "Midnight Archive",
    handle: "cryptkeeper",
    category: "Mystery",
    scene: "archive",
    live: true,
    viewers: 615,
    tags: ["Archive"],
    about:
      "Box by box through a collection that was supposed to stay in storage. We read what we find.",
  },
  {
    slug: "lighting-the-set",
    title: "Lighting the Set",
    handle: "darkroom",
    category: "Halloween Creative",
    scene: "set",
    live: true,
    viewers: 403,
    tags: ["Practical"],
    about:
      "Building the room other people will be scared in tomorrow. Tonight is just light and fog.",
  },
  {
    slug: "armor-fit",
    title: "Armor Fit Check",
    handle: "vesper",
    category: "Cosplay",
    scene: "workshop",
    live: true,
    viewers: 318,
    tags: ["Build"],
    about:
      "Last fitting before the paint cures. If the shoulder doesn't sit, the night is longer.",
  },
  {
    slug: "slow-read",
    title: "A Slow Read of the File",
    handle: "lowsignal",
    category: "Mystery",
    scene: "file",
    live: true,
    viewers: 266,
    tags: ["Casefile"],
    about:
      "One case file, read in order. No theories until the last page is actually on the table.",
  },
  {
    slug: "halloween-mansion",
    title: "Halloween Mansion",
    handle: "nightmarehouse",
    category: "Haunted Places",
    scene: "manor",
    live: false,
    viewers: 84210,
    duration: "3h 42m",
    tags: ["HauntedHouse", "October"],
    about:
      "The full overnight from last weekend. Recorded as it happened, including the hour where nobody spoke.",
  },
  {
    slug: "abandoned-hospital",
    title: "Abandoned Hospital",
    handle: "nightmarehouse",
    category: "Haunted Places",
    scene: "hospital",
    live: false,
    viewers: 120440,
    duration: "2h 11m",
    tags: ["HauntedHouse"],
    about:
      "One corridor, no shortcuts. The recording starts at the loading dock and ends when we had to leave.",
  },
  {
    slug: "halloween-prep",
    title: "Halloween Prep",
    handle: "nightmarehouse",
    category: "Halloween IRL",
    scene: "prep",
    live: false,
    viewers: 33102,
    duration: "58m",
    tags: ["Prep"],
    about:
      "The afternoon before an overnight. Batteries, routes, and the part where we almost called it off.",
  },
  {
    slug: "river-road",
    title: "River Road",
    handle: "ghostcam",
    category: "Paranormal",
    scene: "gate",
    live: false,
    viewers: 54020,
    duration: "1h 16m",
    tags: ["FieldRecording"],
    about: "A single stretch of road, filmed from the shoulder until the battery gave out.",
  },
  {
    slug: "box-12",
    title: "Box 12",
    handle: "cryptkeeper",
    category: "Mystery",
    scene: "archive",
    live: false,
    viewers: 22840,
    duration: "44m",
    tags: ["Archive"],
    about: "Everything that was in box 12, in the order it was packed.",
  },
  {
    slug: "fog-test",
    title: "Fog Test",
    handle: "darkroom",
    category: "Halloween Creative",
    scene: "set",
    live: false,
    viewers: 19002,
    duration: "27m",
    tags: ["Practical"],
    about: "A lighting test that turned into the set. Left in as the recording.",
  },
  {
    slug: "silent-block",
    title: "Silent Block",
    handle: "ashcache",
    category: "Horror Gaming",
    scene: "arcade",
    live: false,
    viewers: 99014,
    duration: "4h 05m",
    tags: ["NoHUD"],
    about: "A four-hour block with almost no commentary. The game is the stream.",
  },
];

export const chatSeed: ChatLine[] = [
  {
    user: "mira",
    ago: "2m",
    badge: "Live",
    tone: "orange",
    text: "the upstairs light just moved",
    likes: 4,
  },
  {
    user: "cole",
    ago: "1m",
    badge: "Clip",
    tone: "blue",
    text: "do not open that door",
  },
  {
    user: "ren",
    ago: "59s",
    badge: "Backed",
    tone: "green",
    text: "backed them. this one deserves it",
    card: {
      title: "NightmareHouse",
      meta: "182.4K support",
      change: "+2,481",
      detail: "watching",
    },
  },
  {
    user: "quinn",
    ago: "59s",
    text: "chat is too calm for this",
  },
  {
    user: "alex",
    ago: "34s",
    badge: "Hype",
    tone: "muted",
    text: "this is crazy",
    likes: 12,
  },
  {
    user: "sam",
    ago: "34s",
    text: "bro 😭",
  },
  {
    user: "john",
    ago: "12s",
    badge: "Live",
    tone: "orange",
    text: "NO WAY",
    likes: 3,
  },
];

export function getCreator(handle: string) {
  return creators.find((creator) => creator.handle === handle);
}

export function getStream(slug: string) {
  return streams.find((stream) => stream.slug === slug);
}

export function streamsFor(handle: string) {
  return streams.filter((stream) => stream.handle === handle);
}

export function liveStreams() {
  return streams.filter((stream) => stream.live);
}

export function leaderboard() {
  return [...creators].sort((a, b) => b.support - a.support);
}

export function liveFor(handle: string) {
  return streams.find((stream) => stream.handle === handle && stream.live);
}

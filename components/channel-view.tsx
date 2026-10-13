"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { BrandBadge, BrandGlyph, brandName } from "@/components/brand-icons";
import { GiftSheet } from "@/components/gift-sheet";
import { VideoThumb } from "@/components/reel-video";
import { ProfileSkeleton } from "@/components/skeletons";
import {
  channelName,
  cleanSocial,
  cleanWebsite,
  fetchProfileByUsername,
  publicMediaUrl,
  saveChannel,
  socialPlatforms,
  socialUrl,
  type Profile,
  type SocialPlatform,
} from "@/lib/profiles";
import { fetchHallowBalance, fetchVaultState, formatTokenAmount } from "@/lib/vault";
import { fetchChannelVideos, type Video } from "@/lib/videos";

const tabs = ["Haunts", "About"] as const;
type Tab = (typeof tabs)[number];

export function ChannelView({ handle }: { handle: string }) {
  const { user, ready, applyProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Video[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [tab, setTab] = useState<Tab>("Haunts");
  const [editing, setEditing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setEditing(false);
    Promise.all([fetchProfileByUsername(handle), fetchChannelVideos(handle)]).then(([nextProfile, nextPosts]) => {
      if (!active) return;
      if (!nextProfile) {
        setStatus("missing");
        return;
      }
      setProfile(nextProfile);
      setPosts(nextPosts);
      setStatus("ready");
    });
    return () => {
      active = false;
    };
  }, [handle]);

  function rememberFile(file: File, kind: "avatar" | "banner") {
    const url = URL.createObjectURL(file);
    if (kind === "avatar") {
      setAvatarFile(file);
      setAvatarPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return url;
      });
      return;
    }
    setBannerFile(file);
    setBannerPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
  }

  function closeEditor() {
    setEditing(false);
    setAvatarFile(null);
    setBannerFile(null);
    setAvatarPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setBannerPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  if (status === "loading") return <ProfileSkeleton />;
  if (status === "missing" || !profile) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">That channel is not here.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">This username does not have a Hallowing channel yet.</p>
        <Link href="/" className="mt-6 inline-flex h-10 w-fit items-center rounded-full bg-accent px-4 text-sm font-semibold text-[#1a0c08]">
          Back home
        </Link>
      </main>
    );
  }

  const owner = ready && user?.id === profile.privy_id;
  const name = channelName(profile);
  const avatar = avatarPreview ?? publicMediaUrl("images", profile.avatar_path);
  const banner = bannerPreview ?? publicMediaUrl("images", profile.banner_path);
  const showEditor = editing && owner;
  const visible = owner ? posts : posts.filter((post) => post.watch === "Everyone");

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pt-4 pb-12 lg:px-6">
      <div className="relative h-32 overflow-hidden rounded-2xl bg-[#14110f] sm:h-48 md:h-56">
        {banner ? (
          <img src={banner} alt={`${name} banner`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,120,58,0.55),transparent_58%),linear-gradient(100deg,#2a1812,#101010_55%,#1a120e)]" />
        )}
        {showEditor ? <ImageButton label="Change banner" className="absolute right-3 bottom-3" onPick={(file) => rememberFile(file, "banner")} /> : null}
        {profile.evm_wallet ? <RankBadge wallet={profile.evm_wallet} /> : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative -mt-14 w-fit sm:-mt-16">
          <Avatar src={avatar} seed={profile.username} alt={`${name} profile photo`} className="size-24 border-4 border-background sm:size-32" />
          {showEditor ? (
            <ImageButton label="Change photo" className="absolute right-1 bottom-1 grid size-8 place-items-center rounded-full border border-line bg-card text-foreground" icon onPick={(file) => rememberFile(file, "avatar")} />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 sm:pt-3">
          <h1 className="truncate text-2xl font-semibold sm:text-3xl">{name}</h1>
          <p className="mt-1 text-sm text-muted">
            @{profile.username}
            <span className="px-1.5">·</span>
            {visible.length} {visible.length === 1 ? "haunt" : "haunts"}
          </p>
          {profile.evm_wallet ? <WalletLine address={profile.evm_wallet} /> : null}
          {showEditor ? null : <ChannelCopy profile={profile} onMore={() => setTab("About")} />}
        </div>
        <div className="sm:pt-3">
          {owner && !showEditor ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/create" className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-semibold text-[#1a0c08] hover:brightness-110">
                Upload a haunt
              </Link>
              <button type="button" onClick={() => setEditing(true)} className="h-9 rounded-full border border-line px-4 text-sm font-medium hover:bg-foreground/5">
                Edit profile
              </button>
            </div>
          ) : null}
          {ready && !owner ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFollowing((value) => !value)}
                className={`h-9 rounded-full px-4 text-sm font-semibold ${following ? "bg-foreground/5 text-muted" : "bg-foreground text-background"}`}
              >
                {following ? "Following" : "Follow"}
              </button>
              <button
                type="button"
                onClick={() => setGiftOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-[#1a0c08]"
              >
                <img src="/gifts/pumpkin-puff.png" alt="" width={256} height={256} className="-ml-1 size-6" />
                Send gift
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {giftOpen ? <GiftSheet creatorName={name} creatorHandle={profile.username} onClose={() => setGiftOpen(false)} /> : null}

      {showEditor ? (
        <EditForm
          profile={profile}
          avatar={avatarFile}
          banner={bannerFile}
          onCancel={closeEditor}
          onSaved={(next) => {
            setProfile(next);
            applyProfile(next);
            closeEditor();
          }}
        />
      ) : (
        <>
          <div className="mt-6 flex gap-6 border-b border-line" role="tablist" aria-label="Channel">
            {tabs.map((item) => {
              const selected = tab === item;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(item)}
                  className={`-mb-px border-b-2 pb-3 text-sm font-medium ${selected ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="py-6" role="tabpanel">
            {tab === "Haunts" ? <VideoGrid posts={visible} owner={owner} /> : <About profile={profile} />}
          </div>
        </>
      )}
    </main>
  );
}

function ImageButton({
  label,
  className,
  icon = false,
  onPick,
}: {
  label: string;
  className: string;
  icon?: boolean;
  onPick: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => input.current?.click()} aria-label={label} className={icon ? className : `${className} rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white`}>
        {icon ? <CameraIcon /> : label}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
        }}
      />
    </>
  );
}

function ChannelCopy({ profile, onMore }: { profile: Profile; onMore: () => void }) {
  const bio = profile.bio.trim();
  return (
    <div className="mt-2 max-w-2xl">
      {bio ? (
        <p className="text-sm leading-6">
          <span className="line-clamp-2">{bio}</span>
          {bio.length > 120 ? (
            <button type="button" onClick={onMore} className="mt-1 block text-sm font-medium">
              more
            </button>
          ) : null}
        </p>
      ) : (
        <p className="text-sm text-muted">No description yet.</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        {profile.website ? (
          <a href={profile.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent">
            {websiteLabel(profile.website)}
          </a>
        ) : null}
        <SocialIcons profile={profile} />
      </div>
    </div>
  );
}

function SocialIcons({ profile }: { profile: Profile }) {
  const linked = socialPlatforms.filter((platform) => profile.socials[platform]);
  if (linked.length === 0) return null;
  return (
    <ul className="flex items-center gap-1.5" aria-label="Socials">
      {linked.map((platform) => (
        <li key={platform}>
          <a
            href={socialUrl(platform, profile.socials[platform]!)}
            target="_blank"
            rel="noreferrer"
            aria-label={`${brandName(platform)} @${profile.socials[platform]}`}
            className="block transition-transform hover:scale-110"
          >
            <BrandBadge brand={platform} className="size-7" glyph={13} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function SocialLinks({ profile }: { profile: Profile }) {
  const linked = socialPlatforms.filter((platform) => profile.socials[platform]);
  if (linked.length === 0) return null;
  return (
    <ul className="space-y-2">
      {linked.map((platform) => (
        <li key={platform}>
          <a
            href={socialUrl(platform, profile.socials[platform]!)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 font-medium hover:text-accent"
          >
            <BrandBadge brand={platform} className="size-7" glyph={13} />
            @{profile.socials[platform]}
            <span className="text-xs font-normal text-muted">{brandName(platform)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function EditForm({
  profile,
  avatar,
  banner,
  onCancel,
  onSaved,
}: {
  profile: Profile;
  avatar: File | null;
  banner: File | null;
  onCancel: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const [name, setName] = useState(channelName(profile));
  const [bio, setBio] = useState(profile.bio);
  const [website, setWebsite] = useState(profile.website ?? "");
  const [socials, setSocials] = useState<Record<SocialPlatform, string>>(() => {
    const draft = {} as Record<SocialPlatform, string>;
    for (const platform of socialPlatforms) draft[platform] = profile.socials[platform] ?? "";
    return draft;
  });
  const [error, setError] = useState<string | null>(null);
  const socialError = "Use letters, numbers, dots, or underscores for usernames.";
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-6 max-w-xl space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        if (!name.trim()) {
          setError("Add a name.");
          return;
        }
        if (cleanWebsite(website) === null) {
          setError("Enter a valid website.");
          return;
        }
        if (socialPlatforms.some((platform) => cleanSocial(socials[platform]) === null)) {
          setError(socialError);
          return;
        }
        setPending(true);
        setError(null);
        void saveChannel({
          privyId: profile.privy_id,
          displayName: name,
          bio,
          website,
          socials,
          avatar,
          banner,
        }).then((saved) => {
          setPending(false);
          if (saved.error || !saved.profile) {
            setError(saved.error ?? "Could not save your profile.");
            return;
          }
          onSaved(saved.profile);
        });
      }}
    >
      <label className="block text-sm font-medium">
        Name
        <input
          value={name}
          maxLength={50}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={error === "Add a name." || undefined}
          className="mt-1 h-10 w-full rounded-lg border border-line bg-background px-3 text-sm font-normal outline-none"
        />
      </label>
      <label className="block text-sm font-medium">
        Bio
        <textarea
          value={bio}
          maxLength={1000}
          onChange={(event) => setBio(event.target.value)}
          className="mt-1 min-h-28 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm font-normal outline-none"
        />
      </label>
      <label className="block text-sm font-medium">
        Website
        <input
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="https://"
          aria-invalid={error === "Enter a valid website." || undefined}
          className="mt-1 h-10 w-full rounded-lg border border-line bg-background px-3 text-sm font-normal outline-none placeholder:text-faint"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Socials</legend>
        <p className="mt-0.5 text-xs text-muted">Fans tag you here when they share a gift.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {socialPlatforms.map((platform) => (
            <label key={platform} className="flex h-10 items-center gap-2 rounded-lg border border-line bg-background pr-3 pl-2 text-sm">
              <span className="grid size-6 shrink-0 place-items-center text-foreground" title={brandName(platform)}>
                <BrandGlyph brand={platform} size={15} />
              </span>
              <span className="sr-only">{brandName(platform)} username</span>
              <span className="text-faint">@</span>
              <input
                value={socials[platform]}
                maxLength={60}
                onChange={(event) => setSocials((current) => ({ ...current, [platform]: event.target.value }))}
                placeholder={brandName(platform)}
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={(error === socialError && cleanSocial(socials[platform]) === null) || undefined}
                className="h-full min-w-0 flex-1 bg-transparent font-normal outline-none placeholder:text-faint"
              />
            </label>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={pending} className="h-10 rounded-full px-4 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50">
          Cancel
        </button>
        <ActionButton type="submit" pending={pending} idle="Save" busy="Saving" className="h-10 rounded-full bg-accent px-5 text-sm font-semibold text-[#1a0c08] disabled:opacity-50" />
      </div>
    </form>
  );
}

function RankBadge({ wallet }: { wallet: string }) {
  const [found, setFound] = useState<{ wallet: string; rank: number | null } | null>(null);
  const rank = found?.wallet === wallet ? found.rank : undefined;

  useEffect(() => {
    let cancelled = false;
    fetchVaultState()
      .then((state) => {
        const index = state?.entries.findIndex((entry) => entry.creator.toLowerCase() === wallet.toLowerCase()) ?? -1;
        if (!cancelled) setFound({ wallet, rank: index >= 0 ? index + 1 : null });
      })
      .catch(() => {
        if (!cancelled) setFound({ wallet, rank: null });
      });
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  if (rank === undefined) return null;
  const top = rank !== null && rank <= 10;

  return (
    <Link
      href="/leaderboard"
      aria-label={rank ? `Rank ${rank} on the leaderboard` : "Leaderboard"}
      className={`absolute top-3 right-3 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold backdrop-blur-md transition hover:brightness-110 ${
        top ? "bg-accent text-[#1a0c08]" : "bg-black/55 text-white"
      }`}
    >
      <TrophyIcon />
      {rank ? (
        <>
          <span className="tabular-nums">#{rank}</span>
          <span className={top ? "text-[#1a0c08]/70" : "text-white/70"}>{top ? "Top 10" : "on leaderboard"}</span>
        </>
      ) : (
        <span>Unranked</span>
      )}
    </Link>
  );
}

function TrophyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M4 1.5h8v1.3h2.3v1.6A3.1 3.1 0 0 1 11.6 7.5 4 4 0 0 1 8.8 9.6v1.6h2.4V14H4.8v-2.8h2.4V9.6A4 4 0 0 1 4.4 7.5 3.1 3.1 0 0 1 1.7 4.4V2.8H4V1.5zm0 2.6H3v.3A1.8 1.8 0 0 0 4 6V4.1zm8 0V6a1.8 1.8 0 0 0 1-1.6v-.3h-1z"
      />
    </svg>
  );
}

function WalletLine({ address }: { address: string }) {
  const [held, setHeld] = useState<{ address: string; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const balance = held?.address === address ? held.text : null;

  useEffect(() => {
    let cancelled = false;
    fetchHallowBalance(address)
      .then((result) => {
        if (!cancelled) setHeld({ address, text: result ? formatTokenAmount(result.balance, result.decimals) : "0" });
      })
      .catch(() => {
        if (!cancelled) setHeld({ address, text: "0" });
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => void copy()}
        title={address}
        aria-label={copied ? "Address copied" : `Copy wallet address ${address}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-xs text-muted hover:bg-foreground/5 hover:text-foreground"
      >
        {`${address.slice(0, 6)}…${address.slice(-4)}`}
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent/10 pr-3 pl-1.5 text-xs font-semibold text-foreground">
        <img src="/gifts/pumpkin-puff.png" alt="" width={256} height={256} className="size-6" />
        {balance === null ? <span className="h-3 w-12 animate-pulse rounded bg-foreground/10" aria-label="Loading balance" /> : <span className="tabular-nums">{balance}</span>}
        <span className="text-muted">HALLOW</span>
      </span>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
      <rect x="5" y="5" width="8.5" height="8.5" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 3.2V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden className="text-accent">
      <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VideoGrid({ posts, owner }: { posts: Video[]; owner: boolean }) {
  if (posts.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted">No haunts yet.</p>
        {owner ? (
          <Link href="/create" className="mt-4 inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-semibold text-[#1a0c08]">
            Upload a haunt
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <VideoCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function VideoCard({ post }: { post: Video }) {
  const title = post.title;
  const when = new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const badge = post.watch === "Only you" ? "Private" : post.watch === "Friends" ? "Unlisted" : null;

  return (
    <article>
      <Link href={`/watch/${post.id}`} data-ghost-haunt className="group relative block aspect-video overflow-hidden rounded-xl bg-black">
        <VideoThumb src={post.src} title={title} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]" />
        {badge ? <span className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">{badge}</span> : null}
      </Link>
      <Link href={`/watch/${post.id}`} className="mt-2 line-clamp-2 block text-sm font-medium hover:text-accent">
        {title}
      </Link>
      <p className="mt-1 text-xs text-muted">{when}</p>
    </article>
  );
}

function About({ profile }: { profile: Profile }) {
  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  return (
    <div className="max-w-2xl space-y-4 text-sm leading-6">
      <p>{profile.bio.trim() || "This channel has no description yet."}</p>
      {profile.website ? (
        <p>
          <a href={profile.website} target="_blank" rel="noreferrer" className="font-medium text-accent">
            {websiteLabel(profile.website)}
          </a>
        </p>
      ) : null}
      <SocialLinks profile={profile} />
      {joined ? <p className="text-muted">Joined {joined}</p> : null}
    </div>
  );
}

function websiteLabel(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M2 4.2h2l.8-1.2h4.4L10 4.2h2c.6 0 1 .4 1 1v5.6c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V5.2c0-.6.4-1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="7.6" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

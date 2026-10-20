create table if not exists public.profiles (
  privy_id text primary key,
  wallet text not null,
  username text not null unique,
  display_name text,
  bio text not null default '',
  website text,
  avatar_path text,
  banner_path text,
  gender text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists banner_path text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists evm_wallet text;
alter table public.profiles add column if not exists social_x text;
alter table public.profiles add column if not exists social_instagram text;
alter table public.profiles add column if not exists social_tiktok text;
alter table public.profiles add column if not exists social_youtube text;
alter table public.profiles add column if not exists social_threads text;
alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check check (gender is null or gender in ('male', 'female'));
create unique index if not exists profiles_evm_wallet_key on public.profiles (evm_wallet) where evm_wallet is not null;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  privy_id text not null references public.profiles (privy_id),
  wallet text not null,
  username text not null,
  caption text not null,
  hashtags text[] not null default '{}',
  tagged text[] not null default '{}',
  watch text not null,
  comments text not null,
  duet text not null,
  stitch text not null,
  video_path text not null,
  created_at timestamptz not null default now()
);

alter table public.posts alter column video_path drop not null;
alter table public.posts add column if not exists kind text not null default 'video';
alter table public.posts add column if not exists live_status text;
alter table public.posts add column if not exists mux_live_stream_id text;
alter table public.posts add column if not exists mux_playback_id text;
alter table public.posts add column if not exists mux_asset_id text;
alter table public.posts add column if not exists mux_recording_id text;
-- The mux_* columns hold the provider's ids for either provider: on Cloudflare, the live input id and the recorded video id.
alter table public.posts add column if not exists live_provider text not null default 'mux';
alter table public.posts add column if not exists live_source text not null default 'app';
alter table public.posts add column if not exists live_seen_at timestamptz;
alter table public.posts drop constraint if exists posts_live_provider_check;
alter table public.posts add constraint posts_live_provider_check check (live_provider in ('mux', 'cloudflare'));
alter table public.posts drop constraint if exists posts_live_source_check;
alter table public.posts add constraint posts_live_source_check check (live_source in ('app', 'browser'));
alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check check (kind in ('video', 'live'));
alter table public.posts drop constraint if exists posts_live_status_check;
alter table public.posts add constraint posts_live_status_check check (live_status is null or live_status in ('waiting', 'active', 'ended'));

create index if not exists posts_feed_idx on public.posts (watch, created_at desc);
create index if not exists posts_live_idx on public.posts (mux_live_stream_id, created_at desc) where kind = 'live';

-- One reusable live stream (Mux) or live input (Cloudflare) per creator. Stream keys are secrets: no anon or authenticated access,
-- only the server (secret key) reads this table.
create table if not exists public.live_channels (
  privy_id text primary key references public.profiles (privy_id),
  mux_live_stream_id text not null unique,
  mux_playback_id text not null,
  stream_key text not null,
  created_at timestamptz not null default now()
);

alter table public.live_channels add column if not exists provider text not null default 'mux';
alter table public.live_channels add column if not exists ingest_url text;
alter table public.live_channels add column if not exists webrtc_url text;

alter table public.live_channels enable row level security;
revoke all on public.live_channels from anon, authenticated;

-- Gas sent from the sponsor wallet to users' Privy wallets. Server only.
create table if not exists public.gas_topups (
  id uuid primary key default gen_random_uuid(),
  privy_id text not null,
  wallet text not null,
  amount_wei text not null,
  amount_usd numeric not null,
  eth_usd numeric not null,
  tx_hash text,
  created_at timestamptz not null default now()
);

create index if not exists gas_topups_wallet_idx on public.gas_topups (wallet, created_at desc);

alter table public.gas_topups enable row level security;
revoke all on public.gas_topups from anon, authenticated;
create index if not exists posts_username_idx on public.posts (username, created_at desc);
create index if not exists posts_hashtags_idx on public.posts using gin (hashtags);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to anon, authenticated;
grant select, insert on public.posts to anon, authenticated;

drop policy if exists "profiles are readable" on public.profiles;
drop policy if exists "profiles can be saved" on public.profiles;
drop policy if exists "profiles can be updated" on public.profiles;
drop policy if exists "posts are readable" on public.posts;
drop policy if exists "posts can be created" on public.posts;

create policy "profiles are readable" on public.profiles for select using (true);
create policy "profiles can be saved" on public.profiles for insert with check (true);
create policy "profiles can be updated" on public.profiles for update using (true);

create policy "posts are readable" on public.posts for select using (true);
create policy "posts can be created" on public.posts for insert with check (true);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  video_key text not null,
  privy_id text not null,
  username text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint comments_body_len check (char_length(body) between 1 and 500)
);

create index if not exists comments_video_key_idx on public.comments (video_key, created_at desc);

create table if not exists public.video_likes (
  video_key text not null,
  privy_id text not null,
  created_at timestamptz not null default now(),
  primary key (video_key, privy_id)
);

alter table public.comments enable row level security;
alter table public.video_likes enable row level security;

grant select, insert on public.comments to anon, authenticated;
grant select, insert, delete on public.video_likes to anon, authenticated;

drop policy if exists "comments are readable" on public.comments;
drop policy if exists "comments can be created" on public.comments;
drop policy if exists "likes are readable" on public.video_likes;
drop policy if exists "likes can be saved" on public.video_likes;
drop policy if exists "likes can be removed" on public.video_likes;

create policy "comments are readable" on public.comments for select using (true);
create policy "comments can be created" on public.comments for insert with check (true);
create policy "likes are readable" on public.video_likes for select using (true);
create policy "likes can be saved" on public.video_likes for insert with check (true);
create policy "likes can be removed" on public.video_likes for delete using (true);

-- Who follows whom. follower_id and following_id are Privy ids.
create table if not exists public.follows (
  follower_id text not null,
  following_id text not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

-- One view per person (or browser, when logged out) per haunt.
create table if not exists public.video_views (
  video_key text not null,
  viewer text not null,
  created_at timestamptz not null default now(),
  primary key (video_key, viewer)
);

create index if not exists video_views_video_idx on public.video_views (video_key);

alter table public.follows enable row level security;
alter table public.video_views enable row level security;

grant select, insert, delete on public.follows to anon, authenticated;
grant select, insert on public.video_views to anon, authenticated;

drop policy if exists "follows are readable" on public.follows;
drop policy if exists "follows can be saved" on public.follows;
drop policy if exists "follows can be removed" on public.follows;
drop policy if exists "views are readable" on public.video_views;
drop policy if exists "views can be saved" on public.video_views;

create policy "follows are readable" on public.follows for select using (true);
create policy "follows can be saved" on public.follows for insert with check (true);
create policy "follows can be removed" on public.follows for delete using (true);
create policy "views are readable" on public.video_views for select using (true);
create policy "views can be saved" on public.video_views for insert with check (true);

-- Solana HALLOW gifts into the escrow wallet. One row per confirmed transfer.
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_privy_id text not null,
  sender_wallet text not null,
  creator_privy_id text not null,
  creator_username text not null,
  video_key text,
  gift_id integer not null,
  quantity integer not null,
  amount_tokens numeric not null,
  amount_raw text not null,
  tx_signature text not null unique,
  created_at timestamptz not null default now(),
  constraint gifts_gift_id_check check (gift_id between 0 and 9),
  constraint gifts_quantity_check check (quantity between 1 and 99),
  constraint gifts_not_self check (sender_privy_id <> creator_privy_id)
);

create index if not exists gifts_creator_idx on public.gifts (creator_privy_id, created_at desc);
create index if not exists gifts_video_idx on public.gifts (video_key, created_at desc);
create index if not exists gifts_sender_idx on public.gifts (sender_privy_id, created_at desc);

alter table public.gifts enable row level security;
grant select on public.gifts to anon, authenticated;
-- Inserts go through the server secret key only.
revoke insert, update, delete on public.gifts from anon, authenticated;

drop policy if exists "gifts are readable" on public.gifts;
create policy "gifts are readable" on public.gifts for select using (true);

insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

drop policy if exists "videos are readable" on storage.objects;
drop policy if exists "videos can be uploaded" on storage.objects;

create policy "videos are readable" on storage.objects for select using (bucket_id = 'videos');
create policy "videos can be uploaded" on storage.objects for insert with check (bucket_id = 'videos');

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "images are readable" on storage.objects;
drop policy if exists "images can be uploaded" on storage.objects;
drop policy if exists "images can be replaced" on storage.objects;

create policy "images are readable" on storage.objects for select using (bucket_id = 'images');
create policy "images can be uploaded" on storage.objects for insert with check (bucket_id = 'images');
create policy "images can be replaced" on storage.objects for update using (bucket_id = 'images');

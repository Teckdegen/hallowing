import { createClient } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";
import { escrowWallet, hallowMint, seasonEndsAt, solanaConnection } from "@/lib/solana";
import { gifts } from "@/lib/gifts";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress, getMint } from "@solana/spl-token";

export type BoardEntry = {
  creatorId: string;
  creator: string;
  username: string;
  gifted: bigint;
  received: bigint[];
};

export type VaultState = {
  mint: string | null;
  escrow: string | null;
  giftsOn: boolean;
  endsAt: number;
  totalGifted: bigint;
  settled: boolean;
  pool: bigint;
  decimals: number;
  prices: bigint[];
  entries: BoardEntry[];
};

export type GiftEvent = {
  sender: string;
  senderId: string;
  creator: string;
  creatorId: string;
  creatorUsername: string;
  videoKey: string | null;
  giftId: number;
  quantity: number;
  amount: bigint;
  txHash: string;
  createdAt: string;
};

const boardSize = 100;
const defaultDecimals = 6;

type GiftRow = {
  sender_privy_id: string;
  sender_wallet: string;
  creator_privy_id: string;
  creator_username: string;
  video_key: string | null;
  gift_id: number;
  quantity: number;
  amount_tokens: number | string;
  amount_raw: string;
  tx_signature: string;
  created_at: string;
};

export function wholeTokensToRaw(amount: number, decimals: number) {
  return BigInt(amount) * BigInt(10) ** BigInt(decimals);
}

export function formatTokenAmount(raw: bigint, decimals: number) {
  const base = BigInt(10) ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;
  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (fraction === BigInt(0)) return wholeText;
  const digits = fraction.toString().padStart(decimals, "0").replace(/0+$/, "").slice(0, 2);
  return `${wholeText}.${digits}`;
}

export function formatWholeTokens(amount: number | bigint) {
  const whole = typeof amount === "bigint" ? amount : BigInt(Math.trunc(amount));
  return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function mintDecimals(connection: Connection, mint: string) {
  try {
    const info = await getMint(connection, new PublicKey(mint));
    return info.decimals;
  } catch {
    const configured = Number(process.env.NEXT_PUBLIC_HALLOW_DECIMALS);
    return Number.isFinite(configured) && configured >= 0 ? configured : defaultDecimals;
  }
}

export async function fetchHallowDecimals() {
  const mint = hallowMint();
  if (!mint) return defaultDecimals;
  return mintDecimals(solanaConnection(), mint);
}

export async function fetchTokenBalance(owner: string, mint: string) {
  try {
    const connection = solanaConnection();
    const ownerKey = new PublicKey(owner);
    const mintKey = new PublicKey(mint);
    const ata = await getAssociatedTokenAddress(mintKey, ownerKey);
    const account = await getAccount(connection, ata);
    return account.amount;
  } catch {
    return BigInt(0);
  }
}

/** Sender wallet's HALLOW balance when the mint is configured. */
export async function fetchHallowBalance(owner: string) {
  const mint = hallowMint();
  if (!mint || !owner) return null;
  const decimals = await fetchHallowDecimals();
  const balance = await fetchTokenBalance(owner, mint);
  return { balance, decimals };
}

async function loadGiftRows(): Promise<GiftRow[]> {
  if (!supabaseEnv()) return [];
  const { data, error } = await createClient()
    .from("gifts")
    .select(
      "sender_privy_id, sender_wallet, creator_privy_id, creator_username, video_key, gift_id, quantity, amount_tokens, amount_raw, tx_signature, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error || !data) return [];
  return data as GiftRow[];
}

function tokensOf(row: GiftRow) {
  return BigInt(Math.trunc(Number(row.amount_tokens) || 0));
}

export async function fetchVaultState(): Promise<VaultState | null> {
  const mint = hallowMint();
  const escrow = escrowWallet();
  const endsAt = seasonEndsAt() ?? Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const giftsOn = Boolean(mint && escrow);
  const decimals = mint ? await fetchHallowDecimals() : defaultDecimals;
  const prices = gifts.map((gift) => wholeTokensToRaw(gift.price, decimals));
  const rows = giftsOn ? await loadGiftRows() : [];

  const byCreator = new Map<string, BoardEntry>();
  let totalGifted = BigInt(0);
  for (const row of rows) {
    const amount = tokensOf(row);
    totalGifted += amount;
    const current = byCreator.get(row.creator_privy_id) ?? {
      creatorId: row.creator_privy_id,
      creator: row.creator_privy_id,
      username: row.creator_username,
      gifted: BigInt(0),
      received: Array.from({ length: 10 }, () => BigInt(0)),
    };
    current.gifted += amount;
    if (row.gift_id >= 0 && row.gift_id < 10) {
      current.received[row.gift_id] += BigInt(row.quantity);
    }
    current.username = row.creator_username || current.username;
    byCreator.set(row.creator_privy_id, current);
  }

  const entries = Array.from(byCreator.values())
    .filter((entry) => entry.gifted > BigInt(0))
    .sort((a, b) => (b.gifted > a.gifted ? 1 : b.gifted < a.gifted ? -1 : a.username.localeCompare(b.username)))
    .slice(0, boardSize)
    .map((entry) => ({ ...entry, creator: entry.creatorId }));

  return {
    mint,
    escrow,
    giftsOn,
    endsAt,
    totalGifted,
    settled: false,
    pool: totalGifted,
    decimals,
    prices,
    entries,
  };
}

export async function fetchGiftEvents(filter: { creatorId?: string; videoKey?: string; senderId?: string } = {}): Promise<GiftEvent[]> {
  if (!supabaseEnv()) return [];
  let query = createClient()
    .from("gifts")
    .select(
      "sender_privy_id, sender_wallet, creator_privy_id, creator_username, video_key, gift_id, quantity, amount_tokens, amount_raw, tx_signature, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter.creatorId) query = query.eq("creator_privy_id", filter.creatorId);
  if (filter.senderId) query = query.eq("sender_privy_id", filter.senderId);
  if (filter.videoKey) query = query.eq("video_key", filter.videoKey);
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as GiftRow[]).map((row) => ({
    sender: row.sender_wallet,
    senderId: row.sender_privy_id,
    creator: row.creator_username,
    creatorId: row.creator_privy_id,
    creatorUsername: row.creator_username,
    videoKey: row.video_key,
    giftId: row.gift_id,
    quantity: row.quantity,
    amount: tokensOf(row),
    txHash: row.tx_signature,
    createdAt: row.created_at,
  }));
}

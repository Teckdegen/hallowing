import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient, createWalletClient, formatEther, getAddress, http, parseEther, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { activeChain, robinhoodRpc } from "@/lib/chain";

/** Top up when the wallet holds less than this much ETH in dollars. */
export const topUpBelowUsd = 0.05;
/** Bring the wallet back up to this much, so one top-up covers a run of gifts. */
export const topUpToUsd = 0.1;
/** At most one top-up per wallet in this window. */
const cooldownMinutes = 60;
/** At most this many top-ups per wallet per day. */
const perWalletDaily = 5;
/** Total dollars the sponsor wallet may send across all users per day. */
const dailyBudgetUsd = Number(process.env.GAS_SPONSOR_DAILY_USD ?? 5);

let cachedPrice: { usd: number; at: number } | null = null;

/** ETH price in USD from Coinbase, cached for five minutes. */
export async function ethUsd() {
  if (cachedPrice && Date.now() - cachedPrice.at < 5 * 60_000) return cachedPrice.usd;
  const response = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", { cache: "no-store" });
  const body = (await response.json()) as { data?: { amount?: string } };
  const usd = Number(body.data?.amount);
  if (!response.ok || !Number.isFinite(usd) || usd <= 0) throw new Error("ETH price unavailable");
  cachedPrice = { usd, at: Date.now() };
  return usd;
}

type PrivyAccount = { type: string; chain_type?: string; wallet_client_type?: string; address?: string };

/** The user's Privy embedded Ethereum wallet, read from Privy rather than trusted from the client. */
export async function embeddedWallet(privyId: string): Promise<Address | null> {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const secret = process.env.PRIVY_APP_SECRET;
  if (!appId || !secret) return null;
  const response = await fetch(`https://auth.privy.io/api/v1/users/${encodeURIComponent(privyId)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${appId}:${secret}`).toString("base64")}`, "privy-app-id": appId },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { linked_accounts?: PrivyAccount[] };
  const wallet = user.linked_accounts?.find(
    (account) => account.type === "wallet" && account.chain_type === "ethereum" && account.wallet_client_type === "privy" && account.address,
  );
  return wallet?.address ? getAddress(wallet.address) : null;
}

export type TopUpResult =
  | { status: "funded"; txHash: Hex; amountEth: string }
  | { status: "enough" | "cooldown" | "budget" | "unavailable" };

export async function topUpIfLow(admin: SupabaseClient, privyId: string, wallet: Address): Promise<TopUpResult> {
  const key = process.env.GAS_SPONSOR_KEY as Hex | undefined;
  if (!key) return { status: "unavailable" };
  const chain = activeChain();
  const transport = http(robinhoodRpc());
  const reader = createPublicClient({ chain, transport });

  const [price, balance] = await Promise.all([ethUsd(), reader.getBalance({ address: wallet })]);
  const balanceUsd = Number(formatEther(balance)) * price;
  if (balanceUsd >= topUpBelowUsd) return { status: "enough" };

  const since = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  const { data: recent } = await admin.from("gas_topups").select("created_at").eq("wallet", wallet).gte("created_at", since(24 * 60));
  const recentRows = (recent ?? []) as { created_at: string }[];
  if (recentRows.length >= perWalletDaily) return { status: "cooldown" };
  if (recentRows.some((row) => row.created_at >= since(cooldownMinutes))) return { status: "cooldown" };

  const { data: today } = await admin.from("gas_topups").select("amount_usd").gte("created_at", since(24 * 60));
  const spent = ((today ?? []) as { amount_usd: number }[]).reduce((sum, row) => sum + Number(row.amount_usd), 0);
  const amountUsd = topUpToUsd - balanceUsd;
  if (spent + amountUsd > dailyBudgetUsd) return { status: "budget" };

  const value = parseEther((amountUsd / price).toFixed(12));
  const { data: claim, error } = await admin
    .from("gas_topups")
    .insert({ privy_id: privyId, wallet, amount_wei: value.toString(), amount_usd: amountUsd, eth_usd: price })
    .select("id")
    .single();
  if (error || !claim) return { status: "unavailable" };

  const { data: racing } = await admin.from("gas_topups").select("id").eq("wallet", wallet).gte("created_at", since(cooldownMinutes));
  if ((racing ?? []).length > 1) {
    await admin.from("gas_topups").delete().eq("id", claim.id);
    return { status: "cooldown" };
  }

  try {
    const sender = createWalletClient({ account: privateKeyToAccount(key), chain, transport });
    const txHash = await sender.sendTransaction({ to: wallet, value });
    await reader.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 });
    await admin.from("gas_topups").update({ tx_hash: txHash }).eq("id", claim.id);
    return { status: "funded", txHash, amountEth: formatEther(value) };
  } catch (sendError) {
    await admin.from("gas_topups").delete().eq("id", claim.id);
    throw sendError;
  }
}

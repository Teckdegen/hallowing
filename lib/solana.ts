import { Connection, PublicKey } from "@solana/web3.js";

export function solanaRpc() {
  return process.env.NEXT_PUBLIC_SOLANA_RPC?.trim() || "https://api.devnet.solana.com";
}

export function solanaCluster(): "devnet" | "mainnet-beta" | "testnet" {
  const value = process.env.NEXT_PUBLIC_SOLANA_CLUSTER?.trim();
  if (value === "mainnet-beta" || value === "mainnet") return "mainnet-beta";
  if (value === "testnet") return "testnet";
  return "devnet";
}

export function solanaChain(): "solana:devnet" | "solana:mainnet" | "solana:testnet" {
  const cluster = solanaCluster();
  if (cluster === "mainnet-beta") return "solana:mainnet";
  if (cluster === "testnet") return "solana:testnet";
  return "solana:devnet";
}

export function hallowMint() {
  const value = process.env.NEXT_PUBLIC_HALLOW_MINT?.trim();
  return value || null;
}

export function escrowWallet() {
  const value = process.env.NEXT_PUBLIC_ESCROW_WALLET?.trim();
  return value || null;
}

export function seasonEndsAt() {
  const raw = process.env.NEXT_PUBLIC_SEASON_ENDS_AT?.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function solanaConnection() {
  return new Connection(solanaRpc(), "confirmed");
}

export function explorerTxUrl(signature: string) {
  const cluster = solanaCluster();
  const base = `https://explorer.solana.com/tx/${signature}`;
  return cluster === "mainnet-beta" ? base : `${base}?cluster=${cluster}`;
}

export function isSolanaAddress(value: string) {
  try {
    const key = new PublicKey(value);
    return PublicKey.isOnCurve(key.toBytes());
  } catch {
    return false;
  }
}

import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import { escrowWallet, hallowMint, solanaConnection } from "@/lib/solana";
import { gifts, maxGiftQuantity } from "@/lib/gifts";
import { wholeTokensToRaw } from "@/lib/vault";

export async function giftCostRaw(giftId: number, quantity: number) {
  const gift = gifts[giftId];
  if (!gift) throw new Error("Pick a gift from the list.");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxGiftQuantity) {
    throw new Error(`Send between 1 and ${maxGiftQuantity}.`);
  }
  const mint = hallowMint();
  if (!mint) throw new Error("HALLOW is not configured yet.");
  const connection = solanaConnection();
  const decimals = (await getMint(connection, new PublicKey(mint))).decimals;
  const amount = wholeTokensToRaw(gift.price, decimals) * BigInt(quantity);
  return { mint, decimals, amount, gift };
}

/** Builds an unsigned SPL transfer of the gift amount from the sender to the escrow wallet. */
export async function buildGiftTransfer(senderWallet: string, giftId: number, quantity: number) {
  const escrow = escrowWallet();
  if (!escrow) throw new Error("The gift escrow is not configured yet.");
  const { mint, decimals, amount, gift } = await giftCostRaw(giftId, quantity);
  const connection = solanaConnection();
  const mintKey = new PublicKey(mint);
  const sender = new PublicKey(senderWallet);
  const escrowKey = new PublicKey(escrow);
  const fromAta = await getAssociatedTokenAddress(mintKey, sender);
  const toAta = await getAssociatedTokenAddress(mintKey, escrowKey);

  const tx = new Transaction();
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(sender, toAta, escrowKey, mintKey),
    createTransferInstruction(fromAta, toAta, sender, amount),
  );
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.feePayer = sender;
  tx.recentBlockhash = blockhash;

  return {
    transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
    amount,
    decimals,
    gift,
    mint,
    escrow,
  };
}

import { getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { gifts, maxGiftQuantity } from "@/lib/gifts";
import { privyUserId } from "@/lib/privy-server";
import { escrowWallet, hallowMint, seasonEndsAt, solanaConnection } from "@/lib/solana";
import { createAdminClient } from "@/lib/supabase/admin";
import { wholeTokensToRaw } from "@/lib/vault";
import { getMint } from "@solana/spl-token";

type Body = {
  signature?: string;
  giftId?: number;
  quantity?: number;
  creatorUsername?: string;
  videoKey?: string | null;
  senderWallet?: string;
};

function asUuid(value: string | null | undefined) {
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

export async function POST(request: Request) {
  const privyId = await privyUserId(request);
  if (!privyId) return Response.json({ error: "Log in to send gifts." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "Gifts are unavailable right now." }, { status: 503 });

  const mint = hallowMint();
  const escrow = escrowWallet();
  if (!mint || !escrow) return Response.json({ error: "Gifting opens when HALLOW escrow is live." }, { status: 503 });

  const endsAt = seasonEndsAt();
  if (endsAt && Date.now() / 1000 >= endsAt) {
    return Response.json({ error: "This season has closed." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const signature = body?.signature?.trim() ?? "";
  const giftId = Number(body?.giftId);
  const quantity = Number(body?.quantity);
  const creatorUsername = body?.creatorUsername?.trim().replace(/^@/, "") ?? "";
  const senderWallet = body?.senderWallet?.trim() ?? "";
  const videoKey = asUuid(body?.videoKey ?? null);
  const gift = gifts[giftId];

  if (!signature || signature.length < 32) return Response.json({ error: "Missing transfer signature." }, { status: 400 });
  if (!gift || !Number.isInteger(giftId)) return Response.json({ error: "Pick a gift from the list." }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxGiftQuantity) {
    return Response.json({ error: `Send between 1 and ${maxGiftQuantity}.` }, { status: 400 });
  }
  if (!creatorUsername) return Response.json({ error: "That creator was not found." }, { status: 400 });
  if (!senderWallet) return Response.json({ error: "Connect your Solana wallet." }, { status: 400 });

  const { data: sender } = await admin.from("profiles").select("privy_id, wallet, username").eq("privy_id", privyId).maybeSingle();
  if (!sender) return Response.json({ error: "Finish setting up your profile first." }, { status: 400 });
  if (sender.wallet && sender.wallet !== senderWallet) {
    return Response.json({ error: "Send the gift from your Hallowing Solana wallet." }, { status: 400 });
  }

  const { data: creator } = await admin
    .from("profiles")
    .select("privy_id, wallet, username")
    .eq("username", creatorUsername)
    .maybeSingle();
  if (!creator) return Response.json({ error: "That creator was not found." }, { status: 404 });
  if (creator.privy_id === privyId) return Response.json({ error: "You cannot gift yourself." }, { status: 400 });

  const connection = solanaConnection();
  const decimals = (await getMint(connection, new PublicKey(mint))).decimals;
  const expected = wholeTokensToRaw(gift.price, decimals) * BigInt(quantity);

  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx || tx.meta?.err) return Response.json({ error: "That transfer was not confirmed on Solana." }, { status: 400 });

  const escrowAta = (await getAssociatedTokenAddress(new PublicKey(mint), new PublicKey(escrow))).toBase58();
  const senderAta = (await getAssociatedTokenAddress(new PublicKey(mint), new PublicKey(senderWallet))).toBase58();
  let moved = BigInt(0);
  for (const ix of tx.transaction.message.instructions) {
    if (!("parsed" in ix) || !ix.parsed || typeof ix.parsed !== "object") continue;
    const parsed = ix.parsed as {
      type?: string;
      info?: { mint?: string; authority?: string; source?: string; destination?: string; amount?: string; tokenAmount?: { amount?: string } };
    };
    if (parsed.type !== "transfer" && parsed.type !== "transferChecked") continue;
    const info = parsed.info ?? {};
    if (info.mint && info.mint !== mint) continue;
    if (info.destination !== escrowAta) continue;
    if (info.authority && info.authority !== senderWallet) continue;
    if (info.source && info.source !== senderAta) continue;
    moved += BigInt(info.tokenAmount?.amount ?? info.amount ?? "0");
  }

  // Fallback: escrow ATA balance delta, only if this wallet signed the transfer.
  if (moved === BigInt(0) && tx.meta?.postTokenBalances && tx.meta.preTokenBalances) {
    const signed = tx.transaction.message.accountKeys.some(
      (key) => (typeof key === "string" ? key : key.pubkey.toBase58()) === senderWallet,
    );
    if (signed) {
      const pre = tx.meta.preTokenBalances.find((row) => row.mint === mint && row.owner === escrow);
      const post = tx.meta.postTokenBalances.find((row) => row.mint === mint && row.owner === escrow);
      if (post?.uiTokenAmount?.amount) {
        const before = BigInt(pre?.uiTokenAmount?.amount ?? "0");
        const after = BigInt(post.uiTokenAmount.amount);
        if (after > before) moved = after - before;
      }
    }
  }

  if (moved < expected) {
    return Response.json({ error: "That transfer does not match the gift amount." }, { status: 400 });
  }

  const amountTokens = gift.price * quantity;
  const { error } = await admin.from("gifts").insert({
    sender_privy_id: privyId,
    sender_wallet: senderWallet,
    creator_privy_id: creator.privy_id,
    creator_username: creator.username,
    video_key: videoKey,
    gift_id: giftId,
    quantity,
    amount_tokens: amountTokens,
    amount_raw: expected.toString(),
    tx_signature: signature,
  });

  if (error) {
    if (error.code === "23505") return Response.json({ ok: true, duplicate: true });
    console.error("[gifts]", error.message);
    return Response.json({ error: "Could not save that gift." }, { status: 500 });
  }

  return Response.json({ ok: true, amountTokens });
}

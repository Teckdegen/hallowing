import { embeddedWallet, topUpIfLow } from "@/lib/gas-server";
import { privyUserId } from "@/lib/privy-server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Sends a little ETH to the caller's Privy wallet when it is too low to pay gas for a gift. */
export async function POST(request: Request) {
  const privyId = await privyUserId(request);
  if (!privyId) return Response.json({ error: "Log in to send gifts." }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return Response.json({ status: "unavailable" });

  const wallet = await embeddedWallet(privyId);
  if (!wallet) return Response.json({ status: "unavailable" });

  try {
    return Response.json(await topUpIfLow(admin, privyId, wallet));
  } catch (error) {
    console.error("[gas]", error instanceof Error ? error.message : error);
    return Response.json({ status: "unavailable" });
  }
}

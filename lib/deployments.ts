import { getAddress, isAddress } from "viem";
import deployments from "@/deployments.json";

export type Deployment = {
  chainId: number;
  vault: string | null;
  vaultFromBlock: number | null;
  operator: string | null;
  hallowToken: string | null;
  endsAt: number | null;
  periodId: number | null;
};

export function deployment(): Deployment {
  const network = process.env.NEXT_PUBLIC_ROBINHOOD_NETWORK === "mainnet" ? "mainnet" : "testnet";
  return deployments[network] as Deployment;
}

export function deployedAddress(key: "vault" | "operator" | "hallowToken") {
  const value = deployment()[key] ?? "";
  return isAddress(value) ? getAddress(value) : null;
}

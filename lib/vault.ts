import { createPublicClient, encodeFunctionData, getAddress, http, isAddress, parseAbi, parseAbiItem, zeroAddress } from "viem";
import { activeChain, robinhoodRpc } from "@/lib/chain";
import { deployedAddress, deployment } from "@/lib/deployments";

const vaultAbi = parseAbi([
  "function gift(address creator, uint256 giftId, uint256 quantity, bytes32 videoId)",
  "function settle()",
  "function operatorWithdraw(uint256 amount)",
  "function operator() view returns (address)",
  "function token() view returns (address)",
  "function tokenDecimals() view returns (uint8)",
  "function endsAt() view returns (uint64)",
  "function periodId() view returns (uint64)",
  "function settled() view returns (bool)",
  "function totalGifted() view returns (uint256)",
  "function creatorCount() view returns (uint256)",
  "function top() view returns (address[] list, uint256[] totals)",
  "function creatorsPage(uint256 start, uint256 limit) view returns (address[] list, uint256[] totals, uint256[10][] counts)",
  "function prices() view returns (uint256[10])",
  "function received(address creator) view returns (uint256[10])",
]);

const pageSize = 250;
const boardSize = 100;

const tokenAbi = parseAbi([
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export type BoardEntry = {
  creator: string;
  gifted: bigint;
  received: bigint[];
};

export type VaultState = {
  operator: string;
  mint: string;
  giftsOn: boolean;
  endsAt: number;
  totalGifted: bigint;
  periodId: bigint;
  settled: boolean;
  pool: bigint;
  decimals: number;
  prices: bigint[];
  entries: BoardEntry[];
};

export type VaultCall = {
  to: `0x${string}`;
  data: `0x${string}`;
  chainId: number;
};

function vaultAddress() {
  return deployedAddress("vault");
}

function client() {
  return createPublicClient({
    chain: activeChain(),
    transport: http(robinhoodRpc(), { batch: true }),
  });
}

export function robinhoodChainId() {
  return activeChain().id;
}

export async function fetchVaultState(): Promise<VaultState | null> {
  const vault = vaultAddress();
  if (!vault) return null;
  const connection = client();
  const read = { address: vault, abi: vaultAbi } as const;
  const [operator, mint, endsAt, totalGifted, periodId, settled, creatorCount, topRow, prices] = await Promise.all([
    connection.readContract({ ...read, functionName: "operator" }),
    connection.readContract({ ...read, functionName: "token" }),
    connection.readContract({ ...read, functionName: "endsAt" }),
    connection.readContract({ ...read, functionName: "totalGifted" }),
    connection.readContract({ ...read, functionName: "periodId" }),
    connection.readContract({ ...read, functionName: "settled" }),
    connection.readContract({ ...read, functionName: "creatorCount" }),
    connection.readContract({ ...read, functionName: "top" }),
    connection.readContract({ ...read, functionName: "prices" }),
  ]);

  const pages = await Promise.all(
    Array.from({ length: Math.ceil(Number(creatorCount) / pageSize) }, (_, index) =>
      connection.readContract({ ...read, functionName: "creatorsPage", args: [BigInt(index * pageSize), BigInt(pageSize)] }),
    ),
  );
  const everyone: BoardEntry[] = pages.flatMap(([list, totals, counts]) =>
    list.map((creator, index) => ({ creator: getAddress(creator), gifted: totals[index], received: [...counts[index]] })),
  );
  const byCreator = new Map(everyone.map((entry) => [entry.creator, entry]));
  const leaders = topRow[0].flatMap((creator) => {
    const entry = byCreator.get(getAddress(creator));
    return entry ? [entry] : [];
  });
  const placed = new Set(leaders.map((entry) => entry.creator));
  const rest = everyone
    .filter((entry) => !placed.has(entry.creator) && entry.gifted > BigInt(0))
    .sort((a, b) => (b.gifted > a.gifted ? 1 : b.gifted < a.gifted ? -1 : 0));
  const entries = [...leaders, ...rest].slice(0, boardSize);

  const giftsOn = mint !== zeroAddress;
  const [pool, decimals] = giftsOn
    ? await Promise.all([
        connection.readContract({ address: mint, abi: tokenAbi, functionName: "balanceOf", args: [vault] }),
        connection.readContract({ address: vault, abi: vaultAbi, functionName: "tokenDecimals" }),
      ])
    : [BigInt(0), 18];

  return {
    operator,
    mint,
    giftsOn,
    endsAt: Number(endsAt),
    totalGifted,
    periodId,
    settled,
    pool,
    decimals: Number(decimals),
    prices: [...prices],
    entries,
  };
}

export async function fetchTokenBalance(owner: string, mint: string) {
  if (!isAddress(owner) || !isAddress(mint)) return BigInt(0);
  return client().readContract({
    address: getAddress(mint),
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [getAddress(owner)],
  });
}

export async function buildGiftCalls(sender: string, creator: string, giftId: number, quantity: number, cost: bigint, videoKey?: string): Promise<VaultCall[]> {
  const vault = vaultAddress();
  if (!vault) throw new Error("The vault is not open yet.");
  if (!isAddress(sender) || !isAddress(creator)) throw new Error("That wallet is not a Robinhood address.");
  const chainId = robinhoodChainId();
  const connection = client();
  const mint = await connection.readContract({ address: vault, abi: vaultAbi, functionName: "token" });
  if (mint === zeroAddress) throw new Error("Gifting turns on soon.");
  const allowance = await connection.readContract({
    address: mint,
    abi: tokenAbi,
    functionName: "allowance",
    args: [getAddress(sender), vault],
  });
  const calls: VaultCall[] = [];
  if (allowance < cost) {
    calls.push({
      to: mint,
      chainId,
      data: encodeFunctionData({ abi: tokenAbi, functionName: "approve", args: [vault, cost] }),
    });
  }
  calls.push({
    to: vault,
    chainId,
    data: encodeFunctionData({
      abi: vaultAbi,
      functionName: "gift",
      args: [getAddress(creator), BigInt(giftId), BigInt(quantity), videoIdFromKey(videoKey)],
    }),
  });
  return calls;
}

export async function buildSettleCall(): Promise<VaultCall> {
  const vault = vaultAddress();
  if (!vault) throw new Error("The vault is not open yet.");
  return {
    to: vault,
    chainId: robinhoodChainId(),
    data: encodeFunctionData({ abi: vaultAbi, functionName: "settle" }),
  };
}

export async function buildOperatorWithdrawCall(amount: bigint): Promise<VaultCall> {
  const vault = vaultAddress();
  if (!vault) throw new Error("The vault is not open yet.");
  return {
    to: vault,
    chainId: robinhoodChainId(),
    data: encodeFunctionData({ abi: vaultAbi, functionName: "operatorWithdraw", args: [amount] }),
  };
}

const zeroVideo = `0x${"0".repeat(64)}` as const;
const giftedEvent = parseAbiItem(
  "event Gifted(address indexed sender, address indexed creator, bytes32 indexed videoId, uint256 giftId, uint256 quantity, uint256 amount, uint256 total)",
);
const paidEvent = parseAbiItem("event Paid(address indexed creator, uint256 rank, uint256 amount)");

/** Post ids are UUIDs, so the 32 hex digits fit in the low half of a bytes32. */
export function videoIdFromKey(videoKey?: string): `0x${string}` {
  const hex = (videoKey ?? "").replace(/-/g, "").toLowerCase();
  return /^[0-9a-f]{32}$/.test(hex) ? `0x${hex.padStart(64, "0")}` : zeroVideo;
}

export function videoKeyFromId(videoId: string) {
  if (!videoId || /^0x0*$/.test(videoId)) return null;
  const hex = videoId.slice(-32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type GiftEvent = {
  sender: string;
  creator: string;
  videoKey: string | null;
  giftId: number;
  quantity: number;
  amount: bigint;
  total: bigint;
  block: bigint;
  txHash: string;
};

export type PaidEvent = {
  creator: string;
  rank: number;
  amount: bigint;
  txHash: string;
};

function fromBlock() {
  return BigInt(deployment().vaultFromBlock ?? 0);
}

/** The vault's token once gifting is on, otherwise the HALLOW listed in deployments.json. */
export async function fetchHallowBalance(owner: string) {
  if (!isAddress(owner)) return null;
  const vault = vaultAddress();
  const connection = client();
  let mint: string | null = null;
  if (vault) {
    const token = await connection.readContract({ address: vault, abi: vaultAbi, functionName: "token" });
    if (token !== zeroAddress) mint = token;
  }
  mint ??= deployedAddress("hallowToken");
  if (!mint) return null;
  const [balance, decimals] = await Promise.all([
    connection.readContract({ address: getAddress(mint), abi: tokenAbi, functionName: "balanceOf", args: [getAddress(owner)] }),
    connection.readContract({ address: getAddress(mint), abi: tokenAbi, functionName: "decimals" }).catch(() => 18),
  ]);
  return { balance, decimals: Number(decimals) };
}

export async function fetchGiftEvents(filter: { creator?: string; videoKey?: string; sender?: string } = {}): Promise<GiftEvent[]> {
  const vault = vaultAddress();
  if (!vault) return [];
  const logs = await client().getLogs({
    address: vault,
    event: giftedEvent,
    args: {
      creator: filter.creator && isAddress(filter.creator) ? getAddress(filter.creator) : undefined,
      sender: filter.sender && isAddress(filter.sender) ? getAddress(filter.sender) : undefined,
      videoId: filter.videoKey ? videoIdFromKey(filter.videoKey) : undefined,
    },
    fromBlock: fromBlock(),
    toBlock: "latest",
  });
  return logs
    .map((log) => ({
      sender: getAddress(log.args.sender!),
      creator: getAddress(log.args.creator!),
      videoKey: videoKeyFromId(log.args.videoId ?? ""),
      giftId: Number(log.args.giftId ?? BigInt(0)),
      quantity: Number(log.args.quantity ?? BigInt(0)),
      amount: log.args.amount ?? BigInt(0),
      total: log.args.total ?? BigInt(0),
      block: log.blockNumber ?? BigInt(0),
      txHash: log.transactionHash ?? "",
    }))
    .reverse();
}

export async function fetchPaidEvents(): Promise<PaidEvent[]> {
  const vault = vaultAddress();
  if (!vault) return [];
  const logs = await client().getLogs({ address: vault, event: paidEvent, fromBlock: fromBlock(), toBlock: "latest" });
  return logs.map((log) => ({
    creator: getAddress(log.args.creator!),
    rank: Number(log.args.rank ?? BigInt(0)),
    amount: log.args.amount ?? BigInt(0),
    txHash: log.transactionHash ?? "",
  }));
}

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

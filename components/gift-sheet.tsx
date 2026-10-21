"use client";

import { useEffect, useId, useState } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { ActionButton } from "@/components/action-button";
import { useAuth } from "@/components/auth-provider";
import { BrandBadge, brandName } from "@/components/brand-icons";
import { giftImage, giftLabel, gifts, maxGiftQuantity, shortTokens, type Gift } from "@/lib/gifts";
import { fetchProfileByUsername, type Socials } from "@/lib/profiles";
import { copiesCaption, creatorTag, giftShareText, shareHref, shareTargets, type ShareTarget } from "@/lib/share";
import { buildGiftCalls, fetchTokenBalance, fetchVaultState, formatTokenAmount, wholeTokensToRaw } from "@/lib/vault";

type Sent = { gift: Gift; quantity: number };

export function GiftSheet({
  creatorName,
  creatorHandle,
  videoKey,
  onClose,
}: {
  creatorName: string;
  creatorHandle: string;
  videoKey?: string;
  onClose: () => void;
}) {
  const { user, login } = useAuth();
  const { sendTransaction } = useSendTransaction();
  const titleId = useId();
  const [selected, setSelected] = useState<Gift>(gifts[0]);
  const [quantity, setQuantity] = useState(1);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [decimals, setDecimals] = useState(18);
  const [prices, setPrices] = useState<bigint[] | null>(null);
  const [creatorWallet, setCreatorWallet] = useState<string | null>(null);
  const [socials, setSocials] = useState<Socials>({});
  const [vaultOpen, setVaultOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState("Approving");
  const [sent, setSent] = useState<Sent | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const videos = Array.from(document.querySelectorAll("video"));
    const playing = videos.filter((video) => !video.paused);
    const hold = (event: Event) => (event.target as HTMLVideoElement).pause();
    videos.forEach((video) => {
      video.pause();
      video.addEventListener("play", hold);
    });
    return () => {
      videos.forEach((video) => video.removeEventListener("play", hold));
      playing.forEach((video) => {
        if (video.isConnected) void video.play().catch(() => undefined);
      });
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetchProfileByUsername(creatorHandle), fetchVaultState()])
      .then(async ([profile, state]) => {
        if (!active) return;
        setCreatorWallet(profile?.evm_wallet ?? null);
        setSocials(profile?.socials ?? {});
        if (!state) {
          setBalance(BigInt(0));
          setNotice("Gifting opens when the season vault goes live.");
          setReady(true);
          return;
        }
        const closed = state.settled || Date.now() / 1000 >= state.endsAt;
        setVaultOpen(!closed && state.giftsOn);
        if (closed) setNotice("This season has closed.");
        else if (!state.giftsOn) setNotice("Gifting turns on soon. Check back shortly.");
        setDecimals(state.decimals);
        setPrices(state.giftsOn ? state.prices : null);
        const owned = user?.evmWallet && state.giftsOn ? await fetchTokenBalance(user.evmWallet, state.mint) : BigInt(0);
        if (!active) return;
        setBalance(owned);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setNotice("Could not read your HALLOW balance.");
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [creatorHandle, user?.evmWallet]);

  const unit = prices?.[selected.id] ?? wholeTokensToRaw(selected.price, decimals);
  const cost = unit * BigInt(quantity);
  const short = balance !== null && ready && vaultOpen && cost > balance;
  const blocked = !ready || !vaultOpen || !creatorWallet || short || pending;

  async function send() {
    if (!user) {
      login();
      return;
    }
    if (!user.evmWallet || !creatorWallet || blocked) return;
    setPending(true);
    setNotice(null);
    setBusy("Preparing");
    try {
      const calls = await buildGiftCalls(user.evmWallet, creatorWallet, selected.id, quantity, cost, videoKey);
      for (let index = 0; index < calls.length; index += 1) {
        setBusy(calls.length > 1 && index === 0 ? "Approving" : "Sending");
        const call = calls[index];
        await sendTransaction({ to: call.to, data: call.data, chainId: call.chainId }, { address: user.evmWallet });
      }
      setBalance((value) => (value === null ? value : value - cost));
      setSent({ gift: selected, quantity });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setNotice(/insufficient funds|gas/i.test(message) ? "Your wallet needs a little ETH on Robinhood Chain for network fees." : "Could not send that gift.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close gifts" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 lg:inset-0 lg:grid lg:place-items-center lg:p-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-support-sheet
          className="comment-sheet pointer-events-auto flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-card px-5 pt-3 pb-5 shadow-2xl lg:max-w-lg lg:rounded-3xl lg:pt-5"
        >
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-foreground/20 lg:hidden" />
          {sent ? (
            <div className="-mx-5 min-h-0 overflow-y-auto px-5">
              <Shared
                titleId={titleId}
                sent={sent}
                creatorName={creatorName}
                creatorHandle={creatorHandle}
                socials={socials}
                videoKey={videoKey}
                onClose={onClose}
              />
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-start justify-between gap-3">
                <h2 id={titleId} className="text-lg font-semibold">
                  Gifts for {creatorName}
                </h2>
                <button type="button" onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-foreground/5" aria-label="Close">
                  <CloseIcon />
                </button>
              </div>

              <div className="-mx-5 min-h-0 overflow-y-auto px-5">
                <ul className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-5" role="listbox" aria-label="Gifts">
                  {gifts.map((gift) => {
                    const active = gift.id === selected.id;
                    return (
                      <li key={gift.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setSelected(gift);
                            setQuantity(1);
                          }}
                          className={`flex w-full flex-col items-center rounded-2xl px-1 pt-2 pb-2 transition-colors ${
                            active ? "bg-accent/12 ring-2 ring-accent" : "hover:bg-foreground/[0.05]"
                          }`}
                        >
                          <img
                            src={giftImage(gift)}
                            alt=""
                            width={256}
                            height={256}
                            className={`size-12 transition-transform sm:size-14 ${active ? "scale-110" : ""}`}
                          />
                          <span className="mt-1 w-full truncate text-center text-[11px] leading-4 font-medium">{gift.name}</span>
                          <span className="text-[11px] leading-4 text-muted tabular-nums">{shortTokens(gift.price)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-foreground/[0.04] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{selected.name}</p>
                    <p className="text-xs text-muted tabular-nums">
                      {formatTokenAmount(cost, decimals)} HALLOW
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Quantity">
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      disabled={quantity <= 1}
                      aria-label="Fewer"
                      className="grid size-9 place-items-center rounded-full border border-line text-lg leading-none hover:bg-foreground/5 disabled:opacity-35"
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-base font-semibold tabular-nums" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.min(maxGiftQuantity, value + 1))}
                      disabled={quantity >= maxGiftQuantity}
                      aria-label="More"
                      className="grid size-9 place-items-center rounded-full border border-line text-lg leading-none hover:bg-foreground/5 disabled:opacity-35"
                    >
                      +
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted">
                  Balance <span className="text-foreground tabular-nums">{balance === null ? "…" : `${formatTokenAmount(balance, decimals)} HALLOW`}</span>
                </p>
                {short ? <p className="mt-1.5 text-sm text-accent">Not enough HALLOW for that.</p> : null}
                {vaultOpen && ready && !creatorWallet ? <p className="mt-1.5 text-sm text-muted">This creator is setting up gifts.</p> : null}
                {notice ? (
                  <p className="mt-1.5 text-sm text-accent" role="alert">
                    {notice}
                  </p>
                ) : null}

                <ActionButton
                  type="button"
                  pending={pending}
                  idle={`Send ${giftLabel(selected, quantity)}`}
                  busy={busy}
                  disabled={blocked && Boolean(user)}
                  onClick={() => void send()}
                  className="mt-4 h-12 w-full rounded-full bg-accent text-sm font-semibold text-[#1a0c08]"
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Shared({
  titleId,
  sent,
  creatorName,
  creatorHandle,
  socials,
  videoKey,
  onClose,
}: {
  titleId: string;
  sent: Sent;
  creatorName: string;
  creatorHandle: string;
  socials: Socials;
  videoKey?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<ShareTarget | "link" | null>(null);
  const label = giftLabel(sent.gift, sent.quantity);
  const url = typeof window === "undefined" ? "" : `${window.location.origin}${videoKey ? `/watch/${videoKey}` : `/creators/${creatorHandle}`}`;

  async function share(target: ShareTarget) {
    const text = giftShareText(label, creatorTag(target, socials, creatorHandle));
    if (copiesCaption(target)) {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(target);
      } catch {
        setCopied(null);
      }
    }
    window.open(shareHref(target, text, url), "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${giftShareText(label, `@${creatorHandle}`)} ${url}`);
      setCopied("link");
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex w-full justify-end">
        <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-foreground/5" aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      <span className="relative grid size-28 place-items-center">
        <span className="absolute inset-2 rounded-full bg-accent/15 blur-xl" aria-hidden />
        <img src={giftImage(sent.gift)} alt="" width={256} height={256} className="ghost-idle relative size-24" />
        {sent.quantity > 1 ? (
          <span className="absolute -right-1 bottom-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-[#1a0c08] tabular-nums">×{sent.quantity}</span>
        ) : null}
      </span>
      <h2 id={titleId} className="mt-3 text-xl font-semibold tracking-tight">
        Gift sent
      </h2>
      <p className="mt-1 text-sm text-muted">
        You gifted {label} to <span className="text-foreground">{creatorName}</span>
      </p>

      <p className="mt-6 text-xs font-medium text-muted">Share it</p>
      <ul className="mt-3 flex flex-wrap justify-center gap-3">
        {shareTargets.map((target) => (
          <li key={target}>
            <button type="button" onClick={() => void share(target)} className="flex w-14 flex-col items-center gap-1.5 text-[11px] text-muted hover:text-foreground">
              <BrandBadge brand={target} />
              <span className="w-full truncate">{copied === target ? "Copied" : brandName(target)}</span>
            </button>
          </li>
        ))}
      </ul>
      {copied === "instagram" || copied === "tiktok" ? <p className="mt-3 text-xs text-muted">Caption copied. Paste it into your post.</p> : null}

      <div className="mt-6 grid w-full grid-cols-2 gap-2">
        <button type="button" onClick={() => void copyLink()} className="h-11 rounded-full border border-line text-sm font-medium hover:bg-foreground/5">
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
        <button type="button" onClick={onClose} className="h-11 rounded-full bg-accent text-sm font-semibold text-[#1a0c08]">
          Done
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path d="M4.2 4.2 13.8 13.8M13.8 4.2 4.2 13.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
